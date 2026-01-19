import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { ValidationError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth';

export class AdminController {
  /**
   * Endpoint para verificar si el usuario actual es admin
   * Útil para el frontend para mostrar/ocultar el panel de administración
   */
  async verifyAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      const isAdmin = await adminService.verifyAdmin(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          isAdmin,
          userId: req.user.id,
          role: req.user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;

      const result = await adminService.getAllUsers(page, limit, search);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un usuario por ID (solo admin)
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar el rol de un usuario (solo admin)
   */
  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        throw new ValidationError('El rol es requerido');
      }

      // No permitir que un admin cambie su propio rol
      if (req.user && req.user.id === id) {
        throw new ValidationError('No puedes cambiar tu propio rol');
      }

      const user = await adminService.updateUserRole(id, role);

      res.status(200).json({
        success: true,
        data: user,
        message: 'Rol actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar un usuario (solo admin)
   */
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // No permitir que un admin se elimine a sí mismo
      if (req.user && req.user.id === id) {
        throw new ValidationError('No puedes eliminarte a ti mismo');
      }

      const result = await adminService.deleteUser(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas generales (solo admin)
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();


