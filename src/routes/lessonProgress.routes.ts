import { Router } from 'express';
import Joi from 'joi';
import { lessonProgressController } from '../controllers/lessonProgress.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { publicLimiter } from '../middlewares/rateLimit';

const router = Router();

// Esquema de validación para actualizar progreso
const updateProgressSchema = Joi.object({
  completed: Joi.boolean().optional(),
  progress: Joi.number().integer().min(0).max(100).optional(),
  lastPosition: Joi.number().integer().min(0).optional().allow(null),
  timeSpent: Joi.number().integer().min(0).optional(),
}).min(1);

// Todas las rutas requieren autenticación (solo estudiantes pueden ver su propio progreso)
router.get(
  '/lessons/:lessonId/progress',
  authenticate,
  publicLimiter,
  lessonProgressController.getProgress.bind(lessonProgressController)
);

router.get(
  '/courses/:courseId/progress',
  authenticate,
  publicLimiter,
  lessonProgressController.getCourseProgress.bind(lessonProgressController)
);

router.put(
  '/lessons/:lessonId/progress',
  authenticate,
  validateRequest(updateProgressSchema),
  lessonProgressController.updateProgress.bind(lessonProgressController)
);

router.post(
  '/lessons/:lessonId/progress/complete',
  authenticate,
  lessonProgressController.markAsCompleted.bind(lessonProgressController)
);

router.get(
  '/courses/:courseId/progress/stats',
  authenticate,
  publicLimiter,
  lessonProgressController.getCourseStats.bind(lessonProgressController)
);

export default router;
