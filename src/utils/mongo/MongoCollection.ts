import {
  AggregationCursor,
  BulkWriteOptions,
  Collection,
  CollectionOptions,
  Condition,
  Db,
  DeleteOptions,
  DeleteResult,
  Document,
  Filter,
  FindCursor,
  FindOneAndUpdateOptions,
  FindOptions as MongoFindOptions,
  ObjectId,
  OptionalUnlessRequiredId,
  SortDirection,
  WithId,
} from 'mongodb';
import { MongoInsertFailedException, MongoNotFoundException, MongoUpdateFailedException } from './MongoException';
import { db } from './dbHelper';

export { ObjectId, Document } from 'mongodb';

export type Sort<TSchema extends Document> = Partial<Record<keyof TSchema, SortDirection>>;

export interface FindOptions<TSchema extends Document> extends Omit<MongoFindOptions<TSchema>, 'sort'> {
  sort?: Sort<TSchema>;
}

export declare interface RootFilterOperatorsCustom<TSchema> {
  $and?: Filter<TSchema>[];
  $nor?: Filter<TSchema>[];
  $or?: Filter<TSchema>[];
  $text?: {
    $search: string;
    $language?: string;
    $caseSensitive?: boolean;
    $diacriticSensitive?: boolean;
  };
  $where?: string | ((this: TSchema) => boolean);
  $comment?: string | Document;
}

export type FindFilter<TSchema> = {
  [P in keyof WithId<TSchema>]?: Condition<WithId<TSchema>[P]>;
} & RootFilterOperatorsCustom<WithId<TSchema>>;

export class MongoCollection<TSchema extends WithId<Document>> {
  private collection: Collection<TSchema>;

  constructor(collectionName: string, database: Db | null = null, options?: CollectionOptions) {
    if (database) {
      this.collection = database.collection<TSchema>(collectionName, options);
      return;
    }
    this.collection = db().collection<TSchema>(collectionName, options);
  }

  aggregate<T extends Document>(pipeline: Document[]): AggregationCursor<T> {
    return this.collection.aggregate<T>(pipeline);
  }

  async findOne(filter: FindFilter<TSchema>, options?: FindOptions<TSchema>): Promise<TSchema | null> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    return this.collection.findOne<TSchema>(filter, options as MongoFindOptions);
  }

  async findOneOrFail(filter: FindFilter<TSchema>, options?: FindOptions<TSchema>): Promise<TSchema> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    const document = await this.collection.findOne<TSchema>(filter, options as MongoFindOptions);
    if (!document) throw new MongoNotFoundException();
    return document;
  }

  async findOneById(id: string): Promise<TSchema> {
    const document = await this.collection.findOne<TSchema>({ _id: new ObjectId(id) } as Filter<TSchema>);
    if (!document) throw new MongoNotFoundException();
    return document;
  }

  async find(filter: FindFilter<TSchema>, options?: FindOptions<TSchema>): Promise<TSchema[]> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    const cursor = this.collection.find<TSchema>(filter, options as MongoFindOptions);
    return await cursor.toArray();
  }

  findCursor(filter: FindFilter<TSchema>, options?: FindOptions<TSchema>): FindCursor<TSchema> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    return this.collection.find<TSchema>(filter, options as MongoFindOptions);
  }

  async insertOne(document: OptionalUnlessRequiredId<TSchema>): Promise<TSchema> {
    const { insertedId, acknowledged } = await this.collection.insertOne(document);
    if (!acknowledged) throw new MongoInsertFailedException();
    return { ...document, _id: new ObjectId(insertedId.id) } as TSchema;
  }

  async update(update: TSchema, options: FindOneAndUpdateOptions = {}): Promise<TSchema> {
    const updateWithSet = { $set: update } as any;
    const result = await this.collection.findOneAndUpdate({ _id: update._id } as Filter<TSchema>, updateWithSet, {
      returnDocument: 'after',
      ...options,
    });
    const document = result.value;
    if (!document) throw new MongoNotFoundException();
    return document as TSchema;
  }

  async updateMany(updates: TSchema[], options: BulkWriteOptions = {}): Promise<TSchema[]> {
    const bulkWriteOperations = updates.map((update) => ({
      updateOne: {
        filter: { _id: update._id } as Filter<TSchema>,
        update: { $set: update },
      },
    }));
    const result = await this.collection.bulkWrite(bulkWriteOperations, options);
    if (!result.isOk()) throw new MongoUpdateFailedException();
    return updates;
  }

  async findOneAndUpdate(
    filter: FindFilter<TSchema>,
    update: Partial<TSchema>,
    options: FindOneAndUpdateOptions = {}
  ): Promise<TSchema> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    const updateWithSet = { $set: update } as any;
    const result = await this.collection.findOneAndUpdate(filter, updateWithSet, {
      returnDocument: 'after',
      ...options,
    });
    const document = result.value;
    if (!document) throw new MongoNotFoundException();
    return document as TSchema;
  }

  async insertMany(documents: OptionalUnlessRequiredId<TSchema>[], options?: BulkWriteOptions): Promise<TSchema[]> {
    const { acknowledged, insertedIds } = await this.collection.insertMany(documents, options || {});
    if (!acknowledged) throw new MongoInsertFailedException();
    return Object.entries(insertedIds).map(([index, _id]) => ({ ...documents[Number(index)], _id } as TSchema));
  }

  async deleteOne(filter?: FindFilter<TSchema>, options?: DeleteOptions): Promise<DeleteResult> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    return await this.collection.deleteOne(filter, options || {});
  }

  async deleteMany(filter?: FindFilter<TSchema>, options?: DeleteOptions): Promise<DeleteResult> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    return await this.collection.deleteMany(filter, options || {});
  }

  async count(filter?: FindFilter<TSchema>): Promise<number> {
    if (typeof filter === 'undefined') throw new Error('filter is required');
    return this.collection.countDocuments(filter);
  }
}
