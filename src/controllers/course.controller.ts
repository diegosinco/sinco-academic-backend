import { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/course.service';

export class CourseController {
  async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        level: req.query.level as string,
        search: req.query.search as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await courseService.getCourses(filters);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCourseBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const course = await courseService.getCourseBySlug(slug);
      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await courseService.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const courseController = new CourseController();



