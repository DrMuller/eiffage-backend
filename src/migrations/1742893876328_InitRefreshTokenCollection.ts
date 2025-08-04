import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class InitRefreshTokenCollection1742893876328 implements MigrationInterface {
  public async up(db: Db): Promise<void | never> {
    await db.collection('refresh_token').createIndex({ userId: 1 });
  }

  public async down(db: Db): Promise<void | never> {
  }
}
