import { Router } from 'express';
import Joi from 'joi';
import { courseController } from '../controllers/course.controller';
import { authenticate } from '../middlewares/auth';
import { requireInstructor } from '../middlewares/authorize';
import { requireAdmin } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { publicLimiter, createLimiter } from '../middlewares/rateLimit';

const router = Router();

// Esquemas de validación
const createCourseSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  slug: Joi.string().required().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).message('El slug debe contener solo letras minúsculas, números y guiones'),
  description: Joi.string().required().min(10),
  shortDescription: Joi.string().max(300).optional().allow('', null),
  categoryId: Joi.string().required(),
  price: Joi.number().required().min(0),
  image: Joi.string().uri().optional().allow('', null),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  duration: Joi.number().min(0).optional().allow(null),
  instructorId: Joi.string().optional(), // Solo para admins
});

const updateCourseSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).message('El slug debe contener solo letras minúsculas, números y guiones').optional(),
  description: Joi.string().min(10).optional(),
  shortDescription: Joi.string().max(300).optional().allow('', null),
  categoryId: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  image: Joi.string().uri().optional().allow('', null),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  duration: Joi.number().min(0).optional().allow(null),
  isPublished: Joi.boolean().optional(),
}).min(1);

// Rutas públicas - Las rutas específicas deben ir antes de las dinámicas
router.get('/', publicLimiter, courseController.getCourses.bind(courseController));
router.get('/categories', publicLimiter, courseController.getCategories.bind(courseController));
router.get('/id/:id', publicLimiter, courseController.getCourseById.bind(courseController));

// Rutas protegidas - Requieren autenticación
// Estas deben ir ANTES de la ruta GET /:slug para evitar conflictos
router.post(
  '/',
  authenticate,
  requireInstructor,
  createLimiter,
  validateRequest(createCourseSchema),
  courseController.createCourse.bind(courseController)
);

// Actualizar curso - Solo el instructor dueño o admin
router.put(
  '/:id',
  authenticate,
  requireInstructor,
  validateRequest(updateCourseSchema),
  courseController.updateCourse.bind(courseController)
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  courseController.deleteCourse.bind(courseController)
);

// Ruta dinámica GET debe ir al final
router.get('/:slug', publicLimiter, courseController.getCourseBySlug.bind(courseController));

export default router;



