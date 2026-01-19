import { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/course.service';
import { AuthRequest } from '../middlewares/auth';
import type { CreateCourseDTO, UpdateCourseDTO } from '../types';

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

  async createCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      // Solo instructores y admins pueden crear cursos
      if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Solo instructores y administradores pueden crear cursos' });
        return;
      }

      const courseData = req.body as CreateCourseDTO;
      const instructorId = req.user.role === 'admin' && req.body.instructorId 
        ? req.body.instructorId 
        : req.user.id;

      const course = await courseService.createCourse(instructorId, courseData);
      res.status(201).json({
        success: true,
        data: course,
        message: 'Curso creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const courseData = req.body as UpdateCourseDTO;

      const course = await courseService.updateCourse(id, req.user.id, req.user.role, courseData);
      res.status(200).json({
        success: true,
        data: course,
        message: 'Curso actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      const { id } = req.params;
      const result = await courseService.deleteCourse(id, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const course = await courseService.getCourseById(id);
      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const courseController = new CourseController();



