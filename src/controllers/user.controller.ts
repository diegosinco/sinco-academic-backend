import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services/user.service';

export class UserController {
  /**
   * @swagger
   * /api/users/profile:
   *   get:
   *     summary: Obtener perfil del usuario autenticado
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Perfil del usuario
   *       401:
   *         description: No autenticado
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const profile = await userService.getUserProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEnrolledCourses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const courses = await userService.getEnrolledCourses(req.user.id);
      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCertificates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const certificates = await userService.getCertificates(req.user.id);
      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const orders = await userService.getUserOrders(req.user.id);
      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const profile = await userService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const { currentPassword, newPassword } = req.body;
      const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();



