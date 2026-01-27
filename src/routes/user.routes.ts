import { Router } from 'express';
import Joi from 'joi';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string(),
  avatar: Joi.string().uri(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

router.get('/profile', userController.getProfile.bind(userController));
router.get('/courses', userController.getEnrolledCourses.bind(userController));
router.get('/certificates', userController.getCertificates.bind(userController));
router.get('/orders', userController.getOrders.bind(userController));
router.put('/profile', validateRequest(updateProfileSchema), userController.updateProfile.bind(userController));
router.put('/change-password', validateRequest(changePasswordSchema), userController.changePassword.bind(userController));

export default router;



