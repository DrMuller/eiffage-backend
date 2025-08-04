import { Request, Response, NextFunction } from "express";
import { HttpException, NotFoundException } from "../utils/HttpException";
import logger from "../utils/logger";
import { ZodError } from "zod";
import { MongoNotFoundException, MongoInsertFailedException, MongoUpdateFailedException } from "../utils/mongo/MongoException";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (err instanceof ZodError) {
    logger.warn(err.message);
    const { errors } = err;
    const message = 'Validation error';
    const code = 'VALIDATION_ERROR';
    res.status(400).json({ message, errors, code });
    return;
  }

  // Handle MongoDB exceptions by converting them to HTTP exceptions
  if (err instanceof MongoNotFoundException) {
    const notFoundError = new NotFoundException(err.message || 'Resource not found');
    res.status(notFoundError.status).json({
      status: "error",
      message: notFoundError.message,
    });
    return;
  }

  // Check for HttpException and all its subclasses
  if (err instanceof HttpException) {
    const status = err.status || 500;
    const message = err.message || 'An error occurred';

    res.status(status).json({
      status: "error",
      message: message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Default to 500 server error for unhandled exceptions
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};