import { Db, ObjectId } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import * as path from 'path';
import * as fs from 'fs';

export class InitSkillsCollections1756123020879 implements MigrationInterface {
  public async up(db: Db): Promise<void | never> {
    // Create indexes for macro_skill_type collection
    await db.collection('macro_skill_type').createIndex({ name: 1 }, { unique: true });
    await db.collection('macro_skill_type').createIndex({ createdAt: 1 });

    // Create indexes for macro_skill collection
    await db.collection('macro_skill').createIndex({ name: 1 });
    await db.collection('macro_skill').createIndex({ macroSkillTypeId: 1 });
    await db.collection('macro_skill').createIndex({ createdAt: 1 });

    // Compound index for efficient queries
    await db.collection('macro_skill').createIndex({ macroSkillTypeId: 1, name: 1 });

    // Create indexes for skill collection
    await db.collection('skill').createIndex({ name: 1 });
    await db.collection('skill').createIndex({ macroSkillId: 1 });
    await db.collection('skill').createIndex({ expectedLevel: 1 });
    await db.collection('skill').createIndex({ createdAt: 1 });

    // Compound indexes for efficient queries
    await db.collection('skill').createIndex({ macroSkillId: 1, name: 1 });
    await db.collection('skill').createIndex({ macroSkillId: 1, expectedLevel: 1 });

    // Seed initial data
    const seedsPath = path.join(__dirname, 'seeds');

    // Helper function to convert MongoDB Extended JSON to regular objects
    const convertExtendedJson = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(convertExtendedJson);
      } else if (obj && typeof obj === 'object') {
        if (obj.$oid) {
          return new ObjectId(obj.$oid);
        } else if (obj.$date) {
          return new Date(obj.$date);
        } else {
          const converted: any = {};
          for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertExtendedJson(value);
          }
          return converted;
        }
      }
      return obj;
    };

    // Load and insert macro skill types
    const macroSkillTypesRaw = JSON.parse(
      fs.readFileSync(path.join(seedsPath, 'macroSkillTypes.json'), 'utf8')
    );
    const macroSkillTypesData = convertExtendedJson(macroSkillTypesRaw);
    if (macroSkillTypesData.length > 0) {
      await db.collection('macro_skill_type').insertMany(macroSkillTypesData);
    }

    // Load and insert macro skills
    const macroSkillsRaw = JSON.parse(
      fs.readFileSync(path.join(seedsPath, 'macroSkills.json'), 'utf8')
    );
    const macroSkillsData = convertExtendedJson(macroSkillsRaw);
    if (macroSkillsData.length > 0) {
      await db.collection('macro_skill').insertMany(macroSkillsData);
    }

    // Load and insert skills
    const skillsRaw = JSON.parse(
      fs.readFileSync(path.join(seedsPath, 'skills.json'), 'utf8')
    );
    const skillsData = convertExtendedJson(skillsRaw);
    if (skillsData.length > 0) {
      await db.collection('skill').insertMany(skillsData);
    }
  }

  public async down(db: Db): Promise<void | never> {
    // Drop all indexes and collections
    await db.collection('skill').drop();
    await db.collection('macro_skill').drop();
    await db.collection('macro_skill_type').drop();
  }
}
