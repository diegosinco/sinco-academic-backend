import { Router } from 'express';
import Joi from 'joi';
import { blogController } from '../controllers/blog.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth';
import { requireInstructor, requireAdmin } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { publicLimiter, createLimiter } from '../middlewares/rateLimit';

const router = Router();

// Esquemas de validación
const createPostSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  slug: Joi.string().required().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).message('El slug debe contener solo letras minúsculas, números y guiones'),
  content: Joi.string().required().min(10),
  excerpt: Joi.string().max(300).optional().allow('', null),
  categoryId: Joi.string().required(),
  featuredImage: Joi.string().uri().optional().allow('', null),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().optional(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).message('El slug debe contener solo letras minúsculas, números y guiones').optional(),
  content: Joi.string().min(10).optional(),
  excerpt: Joi.string().max(300).optional().allow('', null),
  categoryId: Joi.string().optional(),
  featuredImage: Joi.string().uri().optional().allow('', null),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().optional(),
}).min(1);

const updatePostStatusSchema = Joi.object({
  isPublished: Joi.boolean().required(),
});

// Rutas públicas (lectura) - Específicas primero
// Autenticación opcional: si el usuario está autenticado como admin/instructor, verá todos los posts
router.get('/', publicLimiter, optionalAuthenticate, blogController.getPosts.bind(blogController));
router.get('/categories', publicLimiter, blogController.getCategories.bind(blogController));

// Rutas protegidas (escritura) - Requieren autenticación
// Estas deben ir ANTES de la ruta GET /:slug para evitar conflictos
router.post(
  '/',
  authenticate,
  requireInstructor,
  createLimiter,
  validateRequest(createPostSchema),
  blogController.createPost.bind(blogController)
);

router.put(
  '/:id',
  authenticate,
  requireInstructor,
  validateRequest(updatePostSchema),
  blogController.updatePost.bind(blogController)
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  blogController.deletePost.bind(blogController)
);

router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  validateRequest(updatePostStatusSchema),
  blogController.updatePostStatus.bind(blogController)
);

// Ruta dinámica GET debe ir al final para evitar conflictos
// Soporta tanto slug como ID (detecta automáticamente)
router.get('/:identifier', publicLimiter, optionalAuthenticate, blogController.getPostByIdOrSlug.bind(blogController));

export default router;



