import Context from './Context';

declare global {
  namespace Express {
    export interface Request {
      context: Context;
    }
  }
}
