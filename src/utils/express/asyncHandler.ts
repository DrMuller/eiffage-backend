import { Request, Response, NextFunction } from 'express';

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      // Pass all errors to the error handler middleware
      next(error);
    }
  };
};