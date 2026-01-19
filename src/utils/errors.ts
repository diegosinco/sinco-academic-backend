export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso prohibido') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual') {
    super(409, message);
  }
}



