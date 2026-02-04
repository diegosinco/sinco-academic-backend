import { Router } from 'express';
import Joi from 'joi';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { upload, uploadAvatar } from '../middlewares/upload';

const router = Router();

// Esquema de validación para generar SAS
const generateSASSchema = Joi.object({
  fileName: Joi.string().required().min(1).max(255),
  contentType: Joi.string().required(),
  expiresInMinutos: Joi.number().integer().min(1).max(60).optional(),
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// Generar URL pre-firmada para subir archivo
router.post(
  '/generate-sas',
  validateRequest(generateSASSchema),
  uploadController.generateUploadSAS.bind(uploadController)
);

// Subir avatar (a través del backend)
router.post(
  '/avatar',
  uploadAvatar.single('file'),
  uploadController.uploadAvatar.bind(uploadController)
);

// Subir archivo genérico (a través del backend)
router.post(
  '/',
  upload.single('file'),
  uploadController.uploadFile.bind(uploadController)
);

// Eliminar archivo
router.delete(
  '/:blobName',
  uploadController.deleteFile.bind(uploadController)
);

export default router;
