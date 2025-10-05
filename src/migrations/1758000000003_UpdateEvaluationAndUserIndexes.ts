import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class UpdateEvaluationAndUserIndexes1758000000003 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        // Evaluation - reflect new schema
        await db.collection('evaluation').createIndex({ userId: 1 });
        await db.collection('evaluation').createIndex({ userCode: 1 });
        await db.collection('evaluation').createIndex({ userName: 1 });
        await db.collection('evaluation').createIndex({ userJobId: 1 });
        await db.collection('evaluation').createIndex({ userJobCode: 1 });
        await db.collection('evaluation').createIndex({ managerUserId: 1 });
        await db.collection('evaluation').createIndex({ observationDate: -1 });
        await db.collection('evaluation').createIndex({ createdAt: -1 });
        await db.collection('evaluation').createIndex({ updatedAt: -1 });
        await db.collection('evaluation').createIndex({ createdBy: 1 });

        await db.collection('evaluation').createIndex({ userId: 1, observationDate: -1 });
        await db.collection('evaluation').createIndex({ managerUserId: 1, createdAt: -1 });

        // User - reflect jobId addition
        await db.collection('user').createIndex({ jobId: 1 });
    }

    public async down(db: Db): Promise<void | never> {
    }
}


