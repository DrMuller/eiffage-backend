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
    'Matricule',
    'Code emploi',
    'Type',
    'Code',
    'Libellé',
    'Date début',
    'Date fin',
    'Section paie',
    'Etablissement',
    'Métier'
  ];

  const rows = parseFileContent(buffer, filename, requiredColumns);
  const habilitationsCollection = new MongoCollection<Habilitation>('habilitation');
  const usersCollection = new MongoCollection<User>('user');
  const jobsCollection = new MongoCollection<Job>('job');

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const matricule = normalizeString(row['Matricule']);
      const jobCode = normalizeString(row['Code emploi']);
      const type = normalizeString(row['Type']);
      const code = normalizeString(row['Code']);
      const label = normalizeString(row['Libellé']);
      const startDate = parseDateOrDefault(row['Date début']);
      const endDate = parseDateOrDefault(row['Date fin']);
      const payrollSection = normalizeString(row['Section paie']);
      const establishment = normalizeString(row['Etablissement']);
      const profession = normalizeString(row['Métier']);

      if (!matricule || !code) {
        skipped++;
        errors.push(`Row skipped: missing matricule or code`);
        continue;
      }

      // Find user by matricule
      const user = await usersCollection.findOne({ code: matricule } as any);
      if (!user) {
        skipped++;
        errors.push(`User not found for matricule: ${matricule}`);
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
      errors.push(`Error processing row: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { created, skipped, errors };
}

