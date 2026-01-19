import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Error no controlado
  console.error('Error no controlado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};



