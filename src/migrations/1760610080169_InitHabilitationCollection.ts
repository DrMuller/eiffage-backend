import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class InitHabilitationCollection1760610080169 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        // habilitation collection indexes
        await db.collection('habilitation').createIndex({ userId: 1 });
        await db.collection('habilitation').createIndex({ jobId: 1 });
        await db.collection('habilitation').createIndex({ type: 1 });
        await db.collection('habilitation').createIndex({ code: 1 });
        await db.collection('habilitation').createIndex({ startDate: 1 });
        await db.collection('habilitation').createIndex({ endDate: 1 });
        await db.collection('habilitation').createIndex({ payrollSection: 1 });
        await db.collection('habilitation').createIndex({ establishment: 1 });
        await db.collection('habilitation').createIndex({ profession: 1 });
        await db.collection('habilitation').createIndex({ createdAt: 1 });
        await db.collection('habilitation').createIndex({ updatedAt: 1 });
        
        // compound indexes for common queries
        await db.collection('habilitation').createIndex({ userId: 1, startDate: -1 });
        await db.collection('habilitation').createIndex({ jobId: 1, startDate: -1 });
    }

    public async down(db: Db): Promise<void | never> {
        // Drop all indexes except _id
        await db.collection('habilitation').dropIndexes();
    }
}

