import e from "express";

export class HttpException extends Error {
  status: number;
  message: string;
  errors?: any;

  constructor(status: number, message: string, errors?: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", errors?: any) {
    super(400, message, errors);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

export class ConflictException extends HttpException {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message = "Internal Server Error") {
    super(500, message);
  }
}