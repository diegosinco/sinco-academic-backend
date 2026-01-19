import { Router } from 'express';
import Joi from 'joi';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// Esquemas de validación
const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('student', 'instructor', 'admin').required(),
});

// Rutas públicas (solo requieren autenticación)
// Verificar si el usuario es admin (útil para el frontend)
// Cualquier usuario autenticado puede verificar su rol
router.get('/verify', authenticate, adminController.verifyAdmin.bind(adminController));

// Todas las demás rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireAdmin);

// Gestión de usuarios (solo admin)
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.put(
  '/users/:id/role',
  validateRequest(updateUserRoleSchema),
  adminController.updateUserRole.bind(adminController)
);
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Estadísticas
router.get('/stats', adminController.getStats.bind(adminController));

export default router;

