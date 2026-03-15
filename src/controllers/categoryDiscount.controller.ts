import { Response, NextFunction } from 'express';
import { categoryDiscountService } from '../services/categoryDiscount.service';
import type { AuthRequest } from '../middlewares/auth';
import type {
  CreateCategoryDiscountDTO,
  UpdateCategoryDiscountDTO,
} from '../services/categoryDiscount.service';

export class CategoryDiscountController {
  async getAll(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const discounts = await categoryDiscountService.getAll();
      res.status(200).json({ success: true, data: discounts });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const discount = await categoryDiscountService.getById(id);
      res.status(200).json({ success: true, data: discount });
    } catch (error) {
      next(error);
    }
  }

  async getByCategoryId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const discount = await categoryDiscountService.getByCategoryId(categoryId);
      res.status(200).json({ success: true, data: discount });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateCategoryDiscountDTO;
      const discount = await categoryDiscountService.create(data);
      res.status(201).json({
        success: true,
        data: discount,
        message: 'Descuento de categoría creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateCategoryDiscountDTO;
      const discount = await categoryDiscountService.update(id, data);
      res.status(200).json({
        success: true,
        data: discount,
        message: 'Descuento de categoría actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await categoryDiscountService.delete(id);
      res.status(200).json({
        success: true,
        message: 'Descuento de categoría eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryDiscountController = new CategoryDiscountController();
