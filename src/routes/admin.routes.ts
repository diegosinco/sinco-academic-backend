import { Router } from 'express';
import Joi from 'joi';
import { adminController } from '../controllers/admin.controller';
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

// Rutas públicas (solo requieren autenticación)
// Verificar si el usuario es admin (útil para el frontend)
// Cualquier usuario autenticado puede verificar su rol
router.get('/verify', authenticate, adminController.verifyAdmin.bind(adminController));

// Todas las demás rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireAdmin);

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

export default router;

