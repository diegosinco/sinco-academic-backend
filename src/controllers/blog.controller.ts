import { Request, Response, NextFunction } from 'express';
import { blogService } from '../services/blog.service';

export class BlogController {
  async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await blogService.getPosts(filters);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPostBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const post = await blogService.getPostBySlug(slug);
      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await blogService.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const blogController = new BlogController();


