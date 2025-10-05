import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class AddJobFamilyToJob1758000000005 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        await db.collection('job').updateMany(
            { jobFamily: { $exists: false } },
            { $set: { jobFamily: null } },
        );
        await db.collection('job').createIndex({ jobFamily: 1 });
    }

    public async down(db: Db): Promise<void | never> {
        await db.collection('job').dropIndex('jobFamily_1').catch(() => { });
        await db.collection('job').updateMany({}, { $unset: { jobFamily: "" } });
    }
}


