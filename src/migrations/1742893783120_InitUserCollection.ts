import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class InitUserCollection1742893783120 implements MigrationInterface {
  public async up(db: Db): Promise<void | never> {
    await db.collection('user').createIndex({ email: 1 }, { unique: true });
  }

  public async down(db: Db): Promise<void | never> {
  }
}
