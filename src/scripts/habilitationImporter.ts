import { MongoCollection, ObjectId } from '../utils/mongo/MongoCollection';
import type { Habilitation } from '../habilitation/model/habilitation';
import type { User } from '../auth/model/user';
import type { Job } from '../job/model/job';
import { parseFileContent } from '../utils/fileParser';

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function parseDateOrDefault(value: string | undefined, defaultDate?: Date): Date {
  const v = normalizeString(value);
  if (!v) return defaultDate || new Date();
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  const d2 = new Date(v.replaceAll('/', '-'));
  if (!isNaN(d2.getTime())) return d2;
  return defaultDate || new Date();
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function importHabilitationFromFile(buffer: Buffer, filename: string): Promise<ImportResult> {
  const requiredColumns = [
    'MATRICULE',
    'TYPE',
    'NOM',
    'CODE',
    'LIBELLE',
    'DEBUT',
    'FIN',
    'Section de paie',
    'ETABLISSEMENT',
    'PROFESSION'
  ];

  console.log(`\n📁 Analyse du fichier: ${filename}`);
  console.log(`📋 Colonnes requises: ${requiredColumns.join(', ')}\n`);

  const rows = parseFileContent(buffer, filename, requiredColumns);
  const habilitationsCollection = new MongoCollection<Habilitation>('habilitation');
  const usersCollection = new MongoCollection<User>('user');
  const jobsCollection = new MongoCollection<Job>('job');

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const matricule = normalizeString(row['MATRICULE']);
      const jobCode = normalizeString(row['NOM']); // NOM corresponds to the job name/code
      const type = normalizeString(row['TYPE']);
      const code = normalizeString(row['CODE']);
      const label = normalizeString(row['LIBELLE']);
      const startDate = parseDateOrDefault(row['DEBUT']);
      const endDate = parseDateOrDefault(row['FIN']);
      const payrollSection = normalizeString(row['Section de paie']);
      const establishment = normalizeString(row['ETABLISSEMENT']);
      const profession = normalizeString(row['PROFESSION']);

      if (!matricule || !code) {
        skipped++;
        errors.push(`Ligne ignorée : matricule ou code manquant`);
        continue;
      }

      // Find user by matricule
      const user = await usersCollection.findOne({ code: matricule } as any);
      if (!user) {
        skipped++;
        errors.push(`Utilisateur non trouvé pour le matricule : ${matricule}`);
        continue;
      }

      // Find job by code
      let jobId: ObjectId | null = null;
      if (jobCode) {
        const job = await jobsCollection.findOne({ code: jobCode } as any);
        jobId = job ? job._id : null;
      }

      // Check if habilitation already exists
      const existing = await habilitationsCollection.findOne({
        userId: user._id,
        code: code,
      } as any);

      if (existing) {
        // Update existing habilitation
        await habilitationsCollection.update({
          ...existing,
          jobId: jobId ?? existing.jobId,
          type: type || existing.type,
          label: label || existing.label,
          startDate: startDate,
          endDate: endDate,
          payrollSection: payrollSection || existing.payrollSection,
          establishment: establishment || existing.establishment,
          profession: profession || existing.profession,
          updatedAt: new Date(),
        } as Habilitation);
        created++;
      } else {
        // Create new habilitation
        await habilitationsCollection.insertOne({
          _id: new ObjectId(),
          userId: user._id,
          jobId: jobId ?? user.jobId ?? new ObjectId(),
          type: type || 'N/A',
          code: code,
          label: label || 'N/A',
          startDate: startDate,
          endDate: endDate,
          payrollSection: payrollSection || 'N/A',
          establishment: establishment || 'N/A',
          profession: profession || 'N/A',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Habilitation);
        created++;
      }
    } catch (error) {
      skipped++;
      errors.push(`Erreur lors du traitement de la ligne : ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { created, skipped, errors };
}

