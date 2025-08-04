export const MongoExceptionTypes = ['NOT_FOUND', 'INSERT_FAILED'] as const;
export type MongoExceptionType = (typeof MongoExceptionTypes)[number];

export class MongoNotFoundException extends Error {
  constructor(message: MongoExceptionType = 'NOT_FOUND') {
    super(message);
  }
}

export class MongoInsertFailedException extends Error {
  constructor(message: MongoExceptionType = 'NOT_FOUND') {
    super(message);
  }
}

export class MongoUpdateFailedException extends Error {
  constructor(message: MongoExceptionType = 'NOT_FOUND') {
    super(message);
  }
}
