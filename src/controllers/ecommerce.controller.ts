import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ecommerceService } from '../services/ecommerce.service';

export class EcommerceController {
  async getCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const cart = await ecommerceService.getCart(req.user.id);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const { courseId } = req.body;
      const cart = await ecommerceService.addToCart(req.user.id, courseId);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const { courseId } = req.params;
      const cart = await ecommerceService.removeFromCart(req.user.id, courseId);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      await ecommerceService.clearCart(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Carrito vaciado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, subtotal } = req.body;
      const result = await ecommerceService.validateCoupon(code, subtotal);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      const { couponCode } = req.body;
      const result = await ecommerceService.checkout(req.user.id, couponCode);
      res.status(200).json({
        success: true,
        data: result,
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
      const orders = await ecommerceService.getOrders(req.user.id);
      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ecommerceController = new EcommerceController();



