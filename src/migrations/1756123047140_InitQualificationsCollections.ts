import { Db, ObjectId } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import qualificationTypesRaw from './seeds/qualificationTypes.json';
import qualificationsRaw from './seeds/qualifications.json';

export class InitQualificationsCollections1756123047140 implements MigrationInterface {
  public async up(db: Db): Promise<void | never> {
    // Create indexes for qualification_type collection
    await db.collection('qualification_type').createIndex({ name: 1 }, { unique: true });
    await db.collection('qualification_type').createIndex({ createdAt: 1 });

    // Create indexes for qualification collection
    await db.collection('qualification').createIndex({ name: 1 });
    await db.collection('qualification').createIndex({ qualificationTypeId: 1 });
    await db.collection('qualification').createIndex({ createdAt: 1 });

    // Compound index for efficient queries
    await db.collection('qualification').createIndex({ qualificationTypeId: 1, name: 1 });

    // Seed initial data
    // Helper function to convert MongoDB Extended JSON to regular objects
    const convertExtendedJson = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(convertExtendedJson);
      } else if (obj && typeof obj === 'object') {
        if (obj.$oid) {
          return new ObjectId(obj.$oid);
        } else if (obj.$date) {
          return new Date(obj.$date);
        } else {
          const converted: any = {};
          for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertExtendedJson(value);
          }
          return converted;
        }
      }
      return obj;
    };

    // Load and insert qualification types
    const qualificationTypesData = convertExtendedJson(qualificationTypesRaw);
    if (qualificationTypesData.length > 0) {
      await db.collection('qualification_type').insertMany(qualificationTypesData);
    }

    // Load and insert qualifications
    const qualificationsData = convertExtendedJson(qualificationsRaw);
    if (qualificationsData.length > 0) {
      await db.collection('qualification').insertMany(qualificationsData);
    }
  }

  public async down(db: Db): Promise<void | never> {
    // Drop all indexes and collections
    await db.collection('qualification').drop();
    await db.collection('qualification_type').drop();
  }
}
