import { Router } from 'express';
import Joi from 'joi';
import { adminController } from '../controllers/admin.controller';
import { contentController } from '../controllers/content.controller';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { adminLimiter, createLimiter } from '../middlewares/rateLimit';

const router = Router();

// Esquemas de validación
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'instructor', 'admin').optional(),
  phone: Joi.string().optional().allow('', null),
  avatar: Joi.string().uri().optional().allow('', null),
  isEmailVerified: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional().allow('', null),
  avatar: Joi.string().uri().optional().allow('', null),
  isEmailVerified: Joi.boolean().optional(),
}).min(1);

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('student', 'instructor', 'admin').required(),
});

const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const updateUserPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required(),
});

const createContentElementSchema = Joi.object({
  type: Joi.string().required().min(2).max(50),
  key: Joi.string().required().min(2).max(100).pattern(/^[a-z0-9_-]+$/),
  title: Joi.string().max(200).optional().allow('', null),
  data: Joi.object().required(),
  isActive: Joi.boolean().optional(),
});

const updateContentElementSchema = Joi.object({
  type: Joi.string().min(2).max(50).optional(),
  key: Joi.string().min(2).max(100).pattern(/^[a-z0-9_-]+$/).optional(),
  title: Joi.string().max(200).optional().allow('', null),
  data: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  slug: Joi.string().required().min(2).max(50),
  description: Joi.string().max(500).optional().allow('', null),
  image: Joi.string().uri().optional().allow('', null),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow('', null),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  slug: Joi.string().min(2).max(50).optional(),
  description: Joi.string().max(500).optional().allow('', null),
  image: Joi.string().uri().optional().allow('', null),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow('', null),
}).min(1);

// Rutas públicas (solo requieren autenticación)
// Verificar si el usuario es admin (útil para el frontend)
// Cualquier usuario autenticado puede verificar su rol
router.get('/verify', authenticate, adminController.verifyAdmin.bind(adminController));

// Todas las demás rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

// Lista de instructores (dropdown en creación de curso)
router.get('/instructors', adminController.getInstructors.bind(adminController));

// CRUD Categorías de cursos
router.get('/categories', categoryController.getAll.bind(categoryController));
router.get('/categories/:id', categoryController.getById.bind(categoryController));
router.post(
  '/categories',
  createLimiter,
  validateRequest(createCategorySchema),
  categoryController.create.bind(categoryController)
);
router.put(
  '/categories/:id',
  validateRequest(updateCategorySchema),
  categoryController.update.bind(categoryController)
);
router.delete('/categories/:id', categoryController.delete.bind(categoryController));

// Gestión de usuarios (solo admin)
router.post(
  '/users',
  createLimiter,
  validateRequest(createUserSchema),
  adminController.createUser.bind(adminController)
);
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.put(
  '/users/:id',
  validateRequest(updateUserSchema),
  adminController.updateUser.bind(adminController)
);
router.put(
  '/users/:id/password',
  validateRequest(updateUserPasswordSchema),
  adminController.updateUserPassword.bind(adminController)
);
router.put(
  '/users/:id/role',
  validateRequest(updateUserRoleSchema),
  adminController.updateUserRole.bind(adminController)
);
router.patch(
  '/users/:id/status',
  validateRequest(updateUserStatusSchema),
  adminController.updateUserStatus.bind(adminController)
);
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Estadísticas
router.get('/stats', adminController.getStats.bind(adminController));

// Content elements (CMS)
router.get('/content-elements', contentController.getAll.bind(contentController));
router.get('/content-elements/:id', contentController.getById.bind(contentController));
router.post(
  '/content-elements',
  createLimiter,
  validateRequest(createContentElementSchema),
  contentController.create.bind(contentController)
);
router.put(
  '/content-elements/:id',
  validateRequest(updateContentElementSchema),
  contentController.update.bind(contentController)
);
router.delete('/content-elements/:id', contentController.delete.bind(contentController));

export default router;

