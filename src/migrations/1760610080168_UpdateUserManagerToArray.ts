import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

export class UpdateUserManagerToArray1760610080168 implements MigrationInterface {
  public async up(db: Db): Promise<void | never> {
    const userCollection = db.collection('user');

    // Convert all users with managerUserId field to managerUserIds array
    // Case 1: managerUserId exists and is not null -> convert to single-element array
    await userCollection.updateMany(
      { managerUserId: { $exists: true, $ne: null } },
      [
        {
          $set: {
            managerUserIds: ['$managerUserId']
          }
        },
        {
          $unset: 'managerUserId'
        }
      ]
    );

    // Case 2: managerUserId is null or doesn't exist -> set to empty array
    await userCollection.updateMany(
      {
        $or: [
          { managerUserId: null },
          { managerUserId: { $exists: false } }
        ]
      },
      [
        {
          $set: {
            managerUserIds: []
          }
        },
        {
          $unset: 'managerUserId'
        }
      ]
    );

    // Create index on managerUserIds for efficient querying
    await userCollection.createIndex({ managerUserIds: 1 });
  }

  public async down(db: Db): Promise<void | never> {
    const userCollection = db.collection('user');

    // Revert: Convert managerUserIds array back to single managerUserId
    // Take the first element if array has values, otherwise set to null
    await userCollection.updateMany(
      { managerUserIds: { $exists: true } },
      [
        {
          $set: {
            managerUserId: {
              $cond: {
                if: { $gt: [{ $size: '$managerUserIds' }, 0] },
                then: { $arrayElemAt: ['$managerUserIds', 0] },
                else: null
              }
            }
          }
        },
        {
          $unset: 'managerUserIds'
        }
      ]
    );

    // Drop the index
    await userCollection.dropIndex('managerUserIds_1');
  }
}
