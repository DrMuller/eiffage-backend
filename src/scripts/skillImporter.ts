import { MongoCollection, ObjectId } from '../utils/mongo/MongoCollection';
import type { MacroSkillType } from '../skills/model/macroSkillType';
import type { MacroSkill } from '../skills/model/macroSkill';
import type { Skill } from '../skills/model/skill';
import type { Job } from '../job/model/job';
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
 * Find or create a MacroSkill by name, macroSkillTypeId, and jobId
 */
async function findOrCreateMacroSkill(
  name: string,
  macroSkillTypeId: ObjectId,
  jobId: ObjectId,
  macroSkillsCollection: MongoCollection<MacroSkill>
): Promise<ObjectId> {
  if (!name) throw new Error('MacroSkill name is required');

  // Macro skills are now job-specific, so find by name AND jobId
  const existing = await macroSkillsCollection.findOne({ name, jobId } as any);
  if (existing) {
    return existing._id;
  }

  const inserted = await macroSkillsCollection.insertOne({
    _id: new ObjectId(),
    name,
    macroSkillTypeId,
    jobId,
    createdAt: new Date(),
  } as MacroSkill);

  return inserted._id;
}

/**
 * Find or create a Skill by name, macroSkillId, jobId, and expectedLevel
 */
async function findOrCreateSkill(
  name: string,
  macroSkillId: ObjectId,
  jobId: ObjectId,
  expectedLevel: number,
  skillsCollection: MongoCollection<Skill>
): Promise<ObjectId> {
  if (!name) throw new Error('Skill name is required');

  // Skills are now job-specific, so find by name AND jobId
  const existing = await skillsCollection.findOne({ name, jobId } as any);
  if (existing) {
    return existing._id;
  }

  const inserted = await skillsCollection.insertOne({
    _id: new ObjectId(),
    name,
    macroSkillId,
    jobId,
    expectedLevel,
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
 * Process skills import from CSV rows
 */
async function processSkillsImport(rows: CsvRow[]): Promise<{
  macroSkillTypesProcessed: number;
  macroSkillsProcessed: number;
  skillsProcessed: number;
  skippedRows: number;
}> {
  const macroSkillTypesCollection = new MongoCollection<MacroSkillType>('macro_skill_type');
  const macroSkillsCollection = new MongoCollection<MacroSkill>('macro_skill');
  const skillsCollection = new MongoCollection<Skill>('skill');
  const jobsCollection = new MongoCollection<Job>('job');

  const macroSkillTypesSeen = new Set<string>();
  const macroSkillsSeen = new Set<string>();
  const skillsSeen = new Set<string>();
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
      if (!typeCompetence || !macroCompetence || !microCompetence || !jobCode) {
        skippedRows++;
        continue;
      }

      // 1. Find Job first (required for job-specific skills)
      const jobId = await findJob(jobCode, emploiBulletin, jobsCollection);

      if (!jobId) {
        skippedRows++;
        continue;
      }

      // 2. Find or create MacroSkillType
      const macroSkillTypeId = await findOrCreateMacroSkillType(
        typeCompetence,
        macroSkillTypesCollection
      );
      macroSkillTypesSeen.add(typeCompetence);

      // 3. Find or create MacroSkill (now job-specific)
      const macroSkillId = await findOrCreateMacroSkill(
        macroCompetence,
        macroSkillTypeId,
        jobId,
        macroSkillsCollection
      );
      const macroSkillKey = `${macroCompetence}_${jobId.toString()}`;
      macroSkillsSeen.add(macroSkillKey);

      // 4. Find or create Skill (now job-specific with expectedLevel)
      await findOrCreateSkill(
        microCompetence,
        macroSkillId,
        jobId,
        1, // expectedLevel = 1 as per requirements
        skillsCollection
      );
      const skillKey = `${microCompetence}_${jobId.toString()}`;
      skillsSeen.add(skillKey);
    } catch (error) {
      console.error('Error processing row:', error);
      skippedRows++;
    }
  }

  return {
    macroSkillTypesProcessed: macroSkillTypesSeen.size,
    macroSkillsProcessed: macroSkillsSeen.size,
    skillsProcessed: skillsSeen.size,
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

