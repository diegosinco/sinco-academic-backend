import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    name?: string;
    avatar?: string | null;
    createdAt?: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticación requerido');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role?: string;
      name?: string;
      avatar?: string | null;
      createdAt?: string;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      avatar: decoded.avatar,
      createdAt: decoded.createdAt,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token inválido'));
      return;
    }
    next(error);
  }
};

/**
 * Middleware de autenticación opcional
 * Intenta autenticar al usuario pero no falla si no hay token
 * Útil para rutas que funcionan tanto para usuarios autenticados como no autenticados
 */
export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as {
          id: string;
          email: string;
          role?: string;
          name?: string;
          avatar?: string | null;
        };

        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name,
          avatar: decoded.avatar,
        };
      } catch (error) {
        // Si el token es inválido, simplemente continuar sin usuario
        // No lanzar error para permitir acceso público
      }
    }

    next();
  } catch (error) {
    // En caso de cualquier error, continuar sin autenticación
    next();
  }
};



