import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { lessonProgressService } from '../services/lessonProgress.service';

export class LessonProgressController {
  /**
   * @route GET /api/lessons/:lessonId/progress
   * @desc Obtiene el progreso de un estudiante en una lección
   */
  async getProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { lessonId } = req.params;
      const progress = await lessonProgressService.getProgress(req.user.id, lessonId);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/courses/:courseId/progress
   * @desc Obtiene todo el progreso de un estudiante en un curso
   */
  async getCourseProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { courseId } = req.params;
      const progress = await lessonProgressService.getCourseProgress(req.user.id, courseId);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/lessons/:lessonId/progress
   * @desc Actualiza el progreso de un estudiante en una lección
   */
  async updateProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { lessonId } = req.params;
      const { completed, progress, lastPosition, timeSpent } = req.body;

      const updatedProgress = await lessonProgressService.updateProgress(
        req.user.id,
        lessonId,
        {
          completed,
          progress,
          lastPosition,
          timeSpent,
        }
      );

      res.status(200).json({
        success: true,
        data: updatedProgress,
        message: 'Progreso actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/lessons/:lessonId/progress/complete
   * @desc Marca una lección como completada
   */
  async markAsCompleted(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { lessonId } = req.params;
      const progress = await lessonProgressService.markAsCompleted(req.user.id, lessonId);

      res.status(200).json({
        success: true,
        data: progress,
        message: 'Lección marcada como completada',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/courses/:courseId/progress/stats
   * @desc Obtiene estadísticas de progreso de un curso
   */
  async getCourseStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { courseId } = req.params;
      const stats = await lessonProgressService.getCourseStats(req.user.id, courseId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const lessonProgressController = new LessonProgressController();
