import { Db, ObjectId } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import jobMacroSkillsRaw from './seeds/jobMacroSkills.json';

interface JobMacroSkillSeed {
  jobCode: string;
  macroSkillType: string;
  macroSkillName: string;
}

export class SeedMacroSkills1770454571037 implements MigrationInterface {
  private normalizeSkillType(skillType: string): string {
    const normalized = skillType.toLowerCase().trim();
    
    if (normalized.includes('comportemental')) {
      return 'comportementales';
    }
    if (normalized.includes('managérial')) {
      return 'managériales';
    }
    if (normalized.includes('technique')) {
      return 'techniques';
    }
    if (normalized.includes('qpse')) {
      return 'qpse';
    }
    
    return normalized;
  }

  public async up(db: Db): Promise<void | never> {
    const jobs = await db.collection('job').find({}).toArray();
    const macroSkillTypes = await db.collection('macro_skill_type').find({}).toArray();

    const jobMap = new Map(
      jobs.map(job => [job.code.toLowerCase(), job._id])
    );

    const macroSkillTypeMap = new Map(
      macroSkillTypes.map(type => [type.name.toLowerCase(), type._id])
    );

    const jobMacroSkills = jobMacroSkillsRaw as JobMacroSkillSeed[];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    const macroSkillsToInsert = [];
    const processedSkills = new Set<string>();

    for (const entry of jobMacroSkills) {
      try {
        const jobId = jobMap.get(entry.jobCode.toLowerCase());
        if (!jobId) {
          skipCount++;
          continue;
        }

        const normalizedSkillType = this.normalizeSkillType(entry.macroSkillType);
        const macroSkillTypeId = macroSkillTypeMap.get(normalizedSkillType);
        if (!macroSkillTypeId) {
          skipCount++;
          continue;
        }

        const uniqueKey = `${jobId.toString()}:${macroSkillTypeId.toString()}:${entry.macroSkillName.toLowerCase()}`;
        
        if (processedSkills.has(uniqueKey)) {
          skipCount++;
          continue;
        }

        processedSkills.add(uniqueKey);

        macroSkillsToInsert.push({
          _id: new ObjectId(),
          name: entry.macroSkillName,
          jobId: jobId,
          macroSkillTypeId: macroSkillTypeId,
          createdAt: new Date(),
        });

        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (macroSkillsToInsert.length > 0) {
      await db.collection('macro_skill').insertMany(macroSkillsToInsert);
    }
  }

  public async down(db: Db): Promise<void | never> {
    const migrationDate = new Date('2025-12-01');
    
    await db.collection('macro_skill').deleteMany({
      createdAt: { $gte: migrationDate }
    });
  }
}
