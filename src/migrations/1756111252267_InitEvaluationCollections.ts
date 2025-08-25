import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class InitEvaluationCollections1756111252267 implements MigrationInterface {
  public async up(db: Db): Promise<void | never> {
    // Create indexes for evaluation collection
    await db.collection('evaluation').createIndex({ employeeId: 1 });
    await db.collection('evaluation').createIndex({ employeeRegistrationNumber: 1 }, { unique: false }); // Allow multiple evaluations per employee
    await db.collection('evaluation').createIndex({ employeeName: 1 });
    await db.collection('evaluation').createIndex({ managerId: 1 });
    await db.collection('evaluation').createIndex({ createdBy: 1 });
    await db.collection('evaluation').createIndex({ observationDate: 1 });
    await db.collection('evaluation').createIndex({ createdAt: 1 });
    await db.collection('evaluation').createIndex({ updatedAt: 1 });

    // Job-related indexes for filtering and reporting
    await db.collection('evaluation').createIndex({ jobFamily: 1 });
    await db.collection('evaluation').createIndex({ jobProfile: 1 });
    await db.collection('evaluation').createIndex({ jobTitle: 1 });
    await db.collection('evaluation').createIndex({ position: 1 });

    // Compound indexes for common query patterns
    await db.collection('evaluation').createIndex({ employeeId: 1, observationDate: -1 }); // Latest evaluations per employee
    await db.collection('evaluation').createIndex({ managerId: 1, createdAt: -1 }); // Manager's evaluations by date
    await db.collection('evaluation').createIndex({ createdBy: 1, createdAt: -1 }); // Creator's evaluations by date

    // Create indexes for evaluation_skill collection
    await db.collection('evaluation_skill').createIndex({ evaluationId: 1 });
    await db.collection('evaluation_skill').createIndex({ skillId: 1 });
    await db.collection('evaluation_skill').createIndex({ macroSkillId: 1 });
    await db.collection('evaluation_skill').createIndex({ macroSkillTypeId: 1 });
    await db.collection('evaluation_skill').createIndex({ createdAt: 1 });

    // Indexes for level-based queries and analytics
    await db.collection('evaluation_skill').createIndex({ expectedLevel: 1 });
    await db.collection('evaluation_skill').createIndex({ observedLevel: 1 });
    await db.collection('evaluation_skill').createIndex({ gap: 1 });

    // Compound index for unique evaluation-skill combination
    await db.collection('evaluation_skill').createIndex(
      { evaluationId: 1, skillId: 1 },
      { unique: true }
    );
  }

  public async down(db: Db): Promise<void | never> {
    // Drop all indexes for evaluation collection
    await db.collection('evaluation').dropIndexes();

    // Drop all indexes for evaluation_skill collection
    await db.collection('evaluation_skill').dropIndexes();
  }
}
