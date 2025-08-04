import { mongoMigrateCli } from 'mongo-migrate-ts';
import appConfig from '../app.config';

mongoMigrateCli({
  uri: appConfig.mongo.url,
  database: appConfig.mongo.database,
  migrationsDir: `${__dirname}`,
  migrationsCollection: 'migrations',
});
