import { Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import type { AuthRequest } from '../middlewares/auth';
import type { CreateCategoryDTO, UpdateCategoryDTO } from '../services/category.service';

export class CategoryController {
  async getAll(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.getAll();
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await categoryService.getById(id);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const category = await categoryService.getBySlug(slug);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateCategoryDTO;
      const category = await categoryService.create(data);
      res.status(201).json({
        success: true,
        data: category,
        message: 'Categoría creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateCategoryDTO;
      const category = await categoryService.update(id, data);
      res.status(200).json({
        success: true,
        data: category,
        message: 'Categoría actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await categoryService.delete(id);
      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
