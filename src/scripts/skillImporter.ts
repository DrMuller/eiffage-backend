import { MongoCollection, ObjectId } from '../utils/mongo/MongoCollection';
import type { MacroSkillType } from '../skills/model/macroSkillType';
import type { MacroSkill } from '../skills/model/macroSkill';
import type { Skill } from '../skills/model/skill';
import type { Job } from '../job/model/job';
import type { JobSkill } from '../job/model/jobSkill';
import { parseFileContent } from '../utils/fileParser';

type CsvRow = Record<string, string>;

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

/**
 * Find or create a MacroSkillType by name
 */
async function findOrCreateMacroSkillType(
  name: string,
  macroSkillTypesCollection: MongoCollection<MacroSkillType>
): Promise<ObjectId> {
  if (!name) throw new Error('MacroSkillType name is required');

  const existing = await macroSkillTypesCollection.findOne({ name } as any);
  if (existing) {
    return existing._id;
  }

  const inserted = await macroSkillTypesCollection.insertOne({
    _id: new ObjectId(),
    name,
    createdAt: new Date(),
  } as MacroSkillType);

  return inserted._id;
}

/**
 * Find or create a MacroSkill by name and macroSkillTypeId
 */
async function findOrCreateMacroSkill(
  name: string,
  macroSkillTypeId: ObjectId,
  macroSkillsCollection: MongoCollection<MacroSkill>
): Promise<ObjectId> {
  if (!name) throw new Error('MacroSkill name is required');

  const existing = await macroSkillsCollection.findOne({ name } as any);
  if (existing) {
    return existing._id;
  }

  const inserted = await macroSkillsCollection.insertOne({
    _id: new ObjectId(),
    name,
    macroSkillTypeId,
    createdAt: new Date(),
  } as MacroSkill);

  return inserted._id;
}

/**
 * Find or create a Skill by name and macroSkillId
 */
async function findOrCreateSkill(
  name: string,
  macroSkillId: ObjectId,
  skillsCollection: MongoCollection<Skill>
): Promise<ObjectId> {
  if (!name) throw new Error('Skill name is required');

  const existing = await skillsCollection.findOne({ name } as any);
  if (existing) {
    return existing._id;
  }

  const inserted = await skillsCollection.insertOne({
    _id: new ObjectId(),
    name,
    macroSkillId,
    createdAt: new Date(),
  } as Skill);

  return inserted._id;
}

/**
 * Find a Job by code. If code is "XXX", search by "Emploi bulletin" field in the name
 */
async function findJob(
  jobCode: string,
  emploiBulletin: string,
  jobsCollection: MongoCollection<Job>
): Promise<ObjectId | null> {
  if (!jobCode) return null;

  // If code is XXX, search by emploiBulletin in the name
  if (jobCode.toUpperCase() === 'XXX') {
    if (!emploiBulletin) return null;
    // Try to find by exact name match
    const byName = await jobsCollection.findOne({ name: emploiBulletin } as any);
    if (byName) return byName._id;

    // Try case-insensitive search
    const allJobs = await jobsCollection.find({});
    const match = allJobs.find(job =>
      job.name.toLowerCase() === emploiBulletin.toLowerCase()
    );
    return match ? match._id : null;
  }

  // Otherwise, search by code
  const job = await jobsCollection.findOne({ code: jobCode } as any);
  return job ? job._id : null;
}

/**
 * Create JobSkill link if it doesn't exist
 */
async function createJobSkillIfNotExists(
  jobId: ObjectId,
  skillId: ObjectId,
  expectedLevel: number,
  jobSkillsCollection: MongoCollection<JobSkill>
): Promise<void> {
  const existing = await jobSkillsCollection.findOne({
    jobId,
    skillId
  } as any);

  if (existing) {
    return; // Already linked
  }

  await jobSkillsCollection.insertOne({
    _id: new ObjectId(),
    jobId,
    skillId,
    expectedLevel,
    createdAt: new Date(),
  } as JobSkill);
}

/**
 * Process skills import from CSV rows
 */
async function processSkillsImport(rows: CsvRow[]): Promise<{
  macroSkillTypesProcessed: number;
  macroSkillsProcessed: number;
  skillsProcessed: number;
  jobSkillsProcessed: number;
  skippedRows: number;
}> {
  const macroSkillTypesCollection = new MongoCollection<MacroSkillType>('macro_skill_type');
  const macroSkillsCollection = new MongoCollection<MacroSkill>('macro_skill');
  const skillsCollection = new MongoCollection<Skill>('skill');
  const jobsCollection = new MongoCollection<Job>('job');
  const jobSkillsCollection = new MongoCollection<JobSkill>('job_skill');

  const macroSkillTypesSeen = new Set<string>();
  const macroSkillsSeen = new Set<string>();
  const skillsSeen = new Set<string>();
  const jobSkillsSeen = new Set<string>();
  let skippedRows = 0;

  for (const row of rows) {
    try {
      // Extract fields from CSV
      const jobCode = normalizeString(row["Code de l'emploi"]);
      const emploiBulletin = normalizeString(row["Emploi bulletin"]);
      const typeCompetence = normalizeString(row["Type compétence"]);
      const macroCompetence = normalizeString(row["Macro-compétences"]);
      const microCompetence = normalizeString(row["Micro Compétence"]);

      // Skip if essential fields are missing
      if (!typeCompetence || !macroCompetence || !microCompetence) {
        skippedRows++;
        continue;
      }

      // 1. Find or create MacroSkillType
      const macroSkillTypeId = await findOrCreateMacroSkillType(
        typeCompetence,
        macroSkillTypesCollection
      );
      macroSkillTypesSeen.add(typeCompetence);

      // 2. Find or create MacroSkill
      const macroSkillId = await findOrCreateMacroSkill(
        macroCompetence,
        macroSkillTypeId,
        macroSkillsCollection
      );
      macroSkillsSeen.add(macroCompetence);

      // 3. Find or create Skill
      const skillId = await findOrCreateSkill(
        microCompetence,
        macroSkillId,
        skillsCollection
      );
      skillsSeen.add(microCompetence);

      // 4. Find Job and create JobSkill link
      if (jobCode) {
        const jobId = await findJob(jobCode, emploiBulletin, jobsCollection);

        if (jobId) {
          const jobSkillKey = `${jobId.toString()}_${skillId.toString()}`;
          if (!jobSkillsSeen.has(jobSkillKey)) {
            await createJobSkillIfNotExists(
              jobId,
              skillId,
              1, // expectedLevel = 1 as per requirements
              jobSkillsCollection
            );
            jobSkillsSeen.add(jobSkillKey);
          }
        }
      }
    } catch (error) {
      console.error('Error processing row:', error);
      skippedRows++;
    }
  }

  return {
    macroSkillTypesProcessed: macroSkillTypesSeen.size,
    macroSkillsProcessed: macroSkillsSeen.size,
    skillsProcessed: skillsSeen.size,
    jobSkillsProcessed: jobSkillsSeen.size,
    skippedRows,
  };
}

export async function importSkillsFromFile(
  buffer: Buffer,
  filename: string
): Promise<{
  macroSkillTypesProcessed: number;
  macroSkillsProcessed: number;
  skillsProcessed: number;
  jobSkillsProcessed: number;
  skippedRows: number;
}> {
  const requiredColumns = [
    "Code de l'emploi",
    "Emploi bulletin",
    "Type compétence",
    "Macro-compétences",
    "Micro Compétence"
  ];

  const rows = parseFileContent(buffer, filename, requiredColumns);

  if (rows.length === 0) {
    throw new Error('No valid data found in file');
  }

  return await processSkillsImport(rows);
}

