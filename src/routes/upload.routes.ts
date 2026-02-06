import { Router } from 'express';
import Joi from 'joi';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { upload, uploadAvatar, uploadBlogImage } from '../middlewares/upload';

const router = Router();

// Esquema de validación para generar SAS (genérico)
const generateSASSchema = Joi.object({
  fileName: Joi.string().required().min(1).max(255),
  contentType: Joi.string().required(),
  expiresInMinutos: Joi.number().integer().min(1).max(60).optional(),
  folder: Joi.string().optional().max(100), // Carpeta opcional para organizar archivos
});

// Esquema simplificado para endpoints específicos (solo fileName y contentType)
const generateSASSimpleSchema = Joi.object({
  fileName: Joi.string().required().min(1).max(255),
  contentType: Joi.string().required(),
  expiresInMinutos: Joi.number().integer().min(1).max(60).optional(),
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// Generar URL pre-firmada genérica (permite especificar folder)
router.post(
  '/generate-sas',
  validateRequest(generateSASSchema),
  uploadController.generateUploadSAS.bind(uploadController)
);

// Generar URL pre-firmada para imágenes de blog (folder automático: "blog")
// El frontend solo envía: { fileName, contentType }
router.post(
  '/generate-sas/blog',
  validateRequest(generateSASSimpleSchema),
  uploadController.generateBlogImageSAS.bind(uploadController)
);

// Generar URL pre-firmada para imágenes de cursos (folder automático: "courses")
// El frontend solo envía: { fileName, contentType }
router.post(
  '/generate-sas/course',
  validateRequest(generateSASSimpleSchema),
  uploadController.generateCourseImageSAS.bind(uploadController)
);

// Subir avatar (a través del backend)
router.post(
  '/avatar',
  uploadAvatar.single('file'),
  uploadController.uploadAvatar.bind(uploadController)
);

// Subir imagen de blog (a través del backend)
router.post(
  '/blog-image',
  uploadBlogImage.single('file'),
  uploadController.uploadBlogImage.bind(uploadController)
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
