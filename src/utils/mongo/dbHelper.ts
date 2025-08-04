import { Db, MongoClient, MongoClientOptions } from 'mongodb';
import appConfig from '../../app.config';
import logger from '../logger';
let client: MongoClient;

export function createClient(connOpts: MongoClientOptions) {
  client = new MongoClient(appConfig.mongo.url, connOpts);
}

export function db(): Db {
  return client.db(appConfig.mongo.database);
}

export async function connect() {
  try {
    createClient({ connectTimeoutMS: 2000 });
    client.on('connectionReady', () => logger.debug('Mongo connection ready'));
    client.on('close', () => logger.debug('Mongo connection lost'));
    client.on('timeout', () => logger.debug('Mongo Timeout'));
    client.on('error', (e) => logger.error(e.message));
    client.on('reconnect', () => logger.debug('Mongo Reconnect'));
    return await client.connect();
  } catch (e) {
    console.error('Could not connect to MongoDB');
    throw e;
  }
}

export function close() {
  return client.close();
}
