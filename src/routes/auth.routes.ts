import { Router } from 'express';
import Joi from 'joi';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimit';

const router = Router();

// Esquemas de validación
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// Rutas con rate limiting específico
router.post('/register', authLimiter, validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login.bind(authController));
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken.bind(authController));
router.post('/logout', validateRequest(refreshTokenSchema), authController.logout.bind(authController));
router.post('/forgot-password', passwordResetLimiter, validateRequest(requestPasswordResetSchema), authController.requestPasswordReset.bind(authController));
router.post('/reset-password', passwordResetLimiter, validateRequest(resetPasswordSchema), authController.resetPassword.bind(authController));

export default router;



