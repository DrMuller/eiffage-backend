import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class InitJobCollections1758000000000 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        // job collection indexes
        await db.collection('job').createIndex({ name: 1 });
        await db.collection('job').createIndex({ code: 1 }, { unique: true });
        await db.collection('job').createIndex({ jobProfile: 1 });
        await db.collection('job').createIndex({ createdAt: 1 });

        // job_skill link collection indexes
        await db.collection('job_skill').createIndex({ jobId: 1 });
        await db.collection('job_skill').createIndex({ skillId: 1 });
        await db.collection('job_skill').createIndex({ levelExpected: 1 });
        await db.collection('job_skill').createIndex({ createdAt: 1 });
        // prevent duplicate links per job/skill
        await db.collection('job_skill').createIndex({ jobId: 1, skillId: 1 }, { unique: true });
    }

    public async down(db: Db): Promise<void | never> {
    }
}


