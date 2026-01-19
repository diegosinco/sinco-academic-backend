import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/errors';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.login(req.body);
      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError(400, 'Refresh token es requerido');
      }

      const { accessToken } = await authService.refreshToken(refreshToken);
      res.status(200).json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);
      res.status(200).json({
        success: true,
        message: 'Si el email existe, se enviará un enlace de recuperación',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.status(200).json({
        success: true,
        message: 'Contraseña restablecida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();



