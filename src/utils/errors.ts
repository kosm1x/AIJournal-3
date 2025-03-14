export enum ErrorType {
  BadRequest = 'BAD_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  Internal = 'INTERNAL_ERROR',
  ValidationError = 'VALIDATION_ERROR'
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';

    // Set status code based on error type
    switch (type) {
      case ErrorType.BadRequest:
        this.statusCode = 400;
        break;
      case ErrorType.Unauthorized:
        this.statusCode = 401;
        break;
      case ErrorType.Forbidden:
        this.statusCode = 403;
        break;
      case ErrorType.NotFound:
        this.statusCode = 404;
        break;
      case ErrorType.Conflict:
        this.statusCode = 409;
        break;
      case ErrorType.ValidationError:
        this.statusCode = 422;
        break;
      default:
        this.statusCode = statusCode;
    }
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}