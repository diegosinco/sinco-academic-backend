import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ForbiddenError } from '../utils/errors';

type UserRole = 'student' | 'instructor' | 'admin';

/**
 * Middleware para verificar que el usuario tiene uno de los roles permitidos
 * @param allowedRoles - Array de roles permitidos
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Usuario no autenticado');
    }

    if (!req.user.role) {
      throw new ForbiddenError('Rol de usuario no encontrado');
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError('No tienes permisos para acceder a este recurso');
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario es admin
 */
export const requireAdmin = authorize('admin');

/**
 * Middleware para verificar que el usuario es instructor o admin
 */
export const requireInstructor = authorize('instructor', 'admin');

/**
 * Middleware para verificar que el usuario es el dueño del recurso o admin
 * Útil para endpoints donde solo el dueño puede acceder (ej: actualizar su propio perfil)
 */
export const requireOwnerOrAdmin = (getUserId: (req: AuthRequest) => string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Usuario no autenticado');
    }

    const resourceUserId = getUserId(req);
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('No tienes permisos para acceder a este recurso');
    }

    next();
  };
};


