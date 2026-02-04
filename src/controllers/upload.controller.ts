import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services/upload.service';
import { userService } from '../services/user.service';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth';
import { config } from '../config/env';

export class UploadController {
  /**
   * Genera una URL pre-firmada para subir un archivo a Azure Blob Storage
   * POST /api/upload/generate-sas
   * Body: { fileName: string, contentType: string, expiresInMinutos?: number }
   */
  async generateUploadSAS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileName, contentType, expiresInMinutos } = req.body;

      if (!fileName) {
        throw new ValidationError('El nombre del archivo es requerido');
      }

      if (!contentType) {
        throw new ValidationError('El tipo de contenido (contentType) es requerido');
      }

      // Validar expiresInMinutos si se proporciona
      const expiresIn = expiresInMinutos 
        ? Math.min(Math.max(1, expiresInMinutos), 60) // Entre 1 y 60 minutos
        : 5; // Default: 5 minutos

      const result = await uploadService.generateUploadSAS(fileName, contentType, expiresIn);

      res.status(200).json({
        success: true,
        data: {
          uploadUrl: result.uploadUrl,
          blobName: result.blobName,
          publicUrl: uploadService.getPublicUrl(result.blobName),
          expiresAt: result.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sube un archivo a través del backend (para avatares, etc.)
   * POST /api/upload/avatar
   * FormData: { file: File }
   */
  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No se proporcionó ningún archivo');
      }

      // Verificar que el usuario esté autenticado
      if (!req.user?.id) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const userId = req.user.id;
      
      // Obtener usuario actual para eliminar avatar anterior si existe
      const currentUser = await userService.getUserProfile(userId);
      
      // Extraer blobName del avatar anterior si existe
      let oldBlobPath: string | null = null;
      if (currentUser.avatar) {
        try {
          // La URL puede ser: https://sincomkt.blob.core.windows.net/academic-assets/users/xxx/file.jpg
          const urlParts = currentUser.avatar.split('/');
          const containerIndex = urlParts.findIndex(part => part === config.azure.containerName);
          if (containerIndex !== -1 && containerIndex < urlParts.length - 1) {
            // Obtener todo después del nombre del contenedor
            const pathAfterContainer = urlParts.slice(containerIndex + 1).join('/').split('?')[0];
            oldBlobPath = pathAfterContainer;
          }
        } catch (error) {
          // Si no se puede extraer, continuar sin eliminar el anterior
          console.error('Error al extraer blobName del avatar anterior:', error);
        }
      }
      
      // Subir archivo a Azure
      const result = await uploadService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        `users/${userId}` // Guardar en carpeta users/{userId}
      );

      // Actualizar campo avatar en la base de datos
      const updatedUser = await userService.updateProfile(userId, {
        avatar: result.publicUrl,
      });

      // Eliminar avatar anterior de Azure si existe y es diferente
      if (oldBlobPath && oldBlobPath !== result.blobName) {
        try {
          await uploadService.deleteBlob(oldBlobPath);
        } catch (error) {
          // No fallar si no se puede eliminar el avatar anterior
          console.error('Error al eliminar avatar anterior:', error);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          url: result.publicUrl,
          blobName: result.blobName,
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sube un archivo genérico
   * POST /api/upload
   * FormData: { file: File, folder?: string }
   */
  async uploadFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No se proporcionó ningún archivo');
      }

      const folder = req.body.folder || 'uploads';
      
      // Subir archivo a Azure
      const result = await uploadService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folder
      );

      res.status(200).json({
        success: true,
        data: {
          url: result.publicUrl,
          blobName: result.blobName,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Elimina un archivo de Azure Blob Storage
   * DELETE /api/upload/:blobName
   */
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { blobName } = req.params;

      if (!blobName) {
        throw new ValidationError('El nombre del blob es requerido');
      }

      await uploadService.deleteBlob(blobName);

      res.status(200).json({
        success: true,
        message: 'Archivo eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
