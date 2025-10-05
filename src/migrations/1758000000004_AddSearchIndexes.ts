import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class AddSearchIndexes1758000000004 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        await db.collection('user').createIndex({ code: 1 });
    }

    public async down(db: Db): Promise<void | never> {
    }
}


