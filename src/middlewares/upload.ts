import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from '../utils/errors';

// Configurar multer para usar memoria (buffer) en lugar de disco
const storage = multer.memoryStorage();

// Filtro de tipos de archivo permitidos
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    // Imágenes
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Tipo de archivo no permitido: ${file.mimetype}`) as any);
  }
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});

// Middleware específico para avatares (solo imágenes)
export const uploadAvatar = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Solo se permiten archivos de imagen para avatares') as any);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo para avatares
  },
});

// Middleware específico para imágenes de blog (solo imágenes, tamaño mayor)
export const uploadBlogImage = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Solo se permiten archivos de imagen para el blog') as any);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo para imágenes de blog
  },
});
