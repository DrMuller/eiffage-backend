import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class AddUserJobIdIndex1758000000001 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        await db.collection('user').createIndex({ jobId: 1 });
    }

    public async down(db: Db): Promise<void | never> {
    }
}


