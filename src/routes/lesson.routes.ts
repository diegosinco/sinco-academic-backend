import { Router } from 'express';
import Joi from 'joi';
import { lessonController } from '../controllers/lesson.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth';
import { requireInstructor } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { publicLimiter, createLimiter } from '../middlewares/rateLimit';

const router = Router();

// Esquemas de validación
const createLessonSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().max(1000).optional().allow('', null),
  vimeoVideoId: Joi.string().optional().allow('', null),
  videoUrl: Joi.string().uri().optional().allow('', null),
  duration: Joi.number().min(0).optional().allow(null),
  order: Joi.number().integer().min(0).optional(),
  isPublished: Joi.boolean().optional(),
  isPreview: Joi.boolean().optional(),
});

const updateLessonSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional().allow('', null),
  vimeoVideoId: Joi.string().optional().allow('', null),
  videoUrl: Joi.string().uri().optional().allow('', null),
  duration: Joi.number().min(0).optional().allow(null),
  order: Joi.number().integer().min(0).optional(),
  isPublished: Joi.boolean().optional(),
  isPreview: Joi.boolean().optional(),
}).min(1);

const createVimeoUploadSchema = Joi.object({
  fileName: Joi.string().required(),
  fileSize: Joi.number().required().min(1),
});

// Rutas públicas (con autenticación opcional para verificar inscripción)
router.get(
  '/courses/:courseId/lessons',
  publicLimiter,
  optionalAuthenticate,
  lessonController.getLessons.bind(lessonController)
);

router.get(
  '/lessons/:id',
  publicLimiter,
  optionalAuthenticate,
  lessonController.getLesson.bind(lessonController)
);

// Esquema de validación para crear múltiples lecciones
const createLessonsBatchSchema = Joi.object({
  lessons: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required().min(3).max(200),
        description: Joi.string().max(1000).optional().allow('', null),
        vimeoVideoId: Joi.string().optional().allow('', null),
        videoUrl: Joi.string().uri().optional().allow('', null),
        duration: Joi.number().min(0).optional().allow(null),
        order: Joi.number().integer().min(0).optional(),
        isPublished: Joi.boolean().optional(),
        isPreview: Joi.boolean().optional(),
      })
    )
    .min(1)
    .required(),
});

// Rutas protegidas - Requieren autenticación
router.post(
  '/courses/:courseId/lessons',
  authenticate,
  requireInstructor,
  createLimiter,
  validateRequest(createLessonSchema),
  lessonController.createLesson.bind(lessonController)
);

router.post(
  '/courses/:courseId/lessons/batch',
  authenticate,
  requireInstructor,
  createLimiter,
  validateRequest(createLessonsBatchSchema),
  lessonController.createLessonsBatch.bind(lessonController)
);

router.put(
  '/lessons/:id',
  authenticate,
  requireInstructor,
  validateRequest(updateLessonSchema),
  lessonController.updateLesson.bind(lessonController)
);

router.delete(
  '/lessons/:id',
  authenticate,
  requireInstructor,
  lessonController.deleteLesson.bind(lessonController)
);

// Rutas de Vimeo
router.post(
  '/vimeo/upload',
  authenticate,
  requireInstructor,
  validateRequest(createVimeoUploadSchema),
  lessonController.createVimeoUpload.bind(lessonController)
);

router.get(
  '/vimeo/videos/:videoId',
  authenticate,
  requireInstructor,
  lessonController.getVimeoVideo.bind(lessonController)
);

router.get(
  '/vimeo/videos/:videoId/embed',
  authenticate,
  requireInstructor,
  lessonController.getVimeoEmbed.bind(lessonController)
);

// Endpoint para obtener embed de una lección específica
// - Preview: sin autenticación (visible para todos)
// - No preview: requiere autenticación e inscripción (incluso si está publicada)
router.get(
  '/lessons/:lessonId/embed',
  optionalAuthenticate,
  lessonController.getLessonEmbed.bind(lessonController)
);

export default router;
