import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { lessonService } from '../services/lesson.service';
import { vimeoService } from '../services/vimeo.service';

export class LessonController {
  /**
   * @route GET /api/courses/:courseId/lessons
   * @desc Obtiene todas las lecciones de un curso
   * - Preview: visible sin autenticación
   * - Publicadas: visible para todos
   * - No publicadas: solo para inscritos o admin/instructor
   */
  async getLessons(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const includeUnpublished = req.user?.role === 'admin' || req.user?.role === 'instructor';
      const userId = req.user?.id;
      
      const lessons = await lessonService.getLessonsByCourse(courseId, includeUnpublished, userId);
      
      res.status(200).json({
        success: true,
        data: lessons,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/lessons/:id
   * @desc Obtiene una lección por ID
   * - Preview: visible sin autenticación
   * - Publicada: visible para todos
   * - No publicada: solo para inscritos o admin/instructor
   */
  async getLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const includeUnpublished = req.user?.role === 'admin' || req.user?.role === 'instructor';
      const userId = req.user?.id;
      
      const lesson = await lessonService.getLessonById(id, includeUnpublished, userId);
      
      res.status(200).json({
        success: true,
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/courses/:courseId/lessons
   * @desc Crea una nueva lección
   */
  async createLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        throw new Error('Usuario no autenticado');
      }

      const { courseId } = req.params;
      const { title, description, vimeoVideoId, videoUrl, duration, order, isPublished, isPreview } = req.body;

      const lesson = await lessonService.createLesson(
        courseId,
        {
          title,
          description,
          vimeoVideoId,
          videoUrl,
          duration,
          order,
          isPublished,
          isPreview,
        },
        req.user.id,
        req.user.role
      );

      res.status(201).json({
        success: true,
        data: lesson,
        message: 'Lección creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/courses/:courseId/lessons/batch
   * @desc Crea múltiples lecciones en lote
   */
  async createLessonsBatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        throw new Error('Usuario no autenticado');
      }

      const { courseId } = req.params;
      const { lessons } = req.body;

      if (!Array.isArray(lessons) || lessons.length === 0) {
        throw new Error('lessons debe ser un array con al menos una lección');
      }

      const createdLessons = await lessonService.createLessonsBatch(
        courseId,
        lessons,
        req.user.id,
        req.user.role
      );

      res.status(201).json({
        success: true,
        data: createdLessons,
        message: `${createdLessons.length} lección(es) creada(s) exitosamente`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/lessons/:id
   * @desc Actualiza una lección
   */
  async updateLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        throw new Error('Usuario no autenticado');
      }

      const { id } = req.params;
      const { title, description, vimeoVideoId, videoUrl, duration, order, isPublished, isPreview } = req.body;

      const lesson = await lessonService.updateLesson(
        id,
        {
          title,
          description,
          vimeoVideoId,
          videoUrl,
          duration,
          order,
          isPublished,
          isPreview,
        },
        req.user.id,
        req.user.role
      );

      res.status(200).json({
        success: true,
        data: lesson,
        message: 'Lección actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/lessons/:id
   * @desc Elimina una lección
   */
  async deleteLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        throw new Error('Usuario no autenticado');
      }

      const { id } = req.params;

      await lessonService.deleteLesson(id, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        message: 'Lección eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/vimeo/upload
   * @desc Crea un video en Vimeo y retorna la URL de upload
   */
  async createVimeoUpload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!vimeoService) {
        throw new Error('Servicio de Vimeo no está configurado');
      }

      const { fileName, fileSize } = req.body;

      if (!fileName || !fileSize) {
        throw new Error('fileName y fileSize son requeridos');
      }

      const videoInfo = await vimeoService.createVideo(fileName, fileSize);

      res.status(200).json({
        success: true,
        data: {
          uploadLink: videoInfo.upload.upload_link,
          videoId: videoInfo.id,
          videoUri: videoInfo.uri,
          videoLink: videoInfo.link,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/vimeo/videos/:videoId
   * @desc Obtiene información de un video de Vimeo
   */
  async getVimeoVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!vimeoService) {
        throw new Error('Servicio de Vimeo no está configurado');
      }

      const { videoId } = req.params;

      const video = await vimeoService.getVideo(videoId);

      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/vimeo/videos/:videoId/embed
   * @desc Obtiene el HTML de embed de un video de Vimeo (solo instructores/admin)
   */
  async getVimeoEmbed(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!vimeoService) {
        throw new Error('Servicio de Vimeo no está configurado');
      }

      const { videoId } = req.params;

      const embedHtml = await vimeoService.getEmbedHtml(videoId);

      res.status(200).json({
        success: true,
        data: {
          embedHtml,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/lessons/:lessonId/embed
   * @desc Obtiene el HTML de embed de una lección
   * - Preview: visible sin autenticación
   * - Publicada: visible para todos
   * - No publicada: solo para inscritos o admin/instructor
   */
  async getLessonEmbed(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!vimeoService) {
        throw new Error('Servicio de Vimeo no está configurado');
      }

      const { lessonId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Obtener la lección (verifica si el usuario puede verla)
      const includeUnpublished = userRole === 'admin' || userRole === 'instructor';
      const lesson = await lessonService.getLessonById(lessonId, includeUnpublished, userId);

      if (!lesson.vimeoVideoId) {
        throw new Error('Esta lección no tiene un video de Vimeo');
      }

      // Verificar si puede acceder (usando el campo isLocked del servicio)
      if (lesson.isLocked) {
        throw new Error('No estás inscrito en este curso para ver esta lección');
      }

      // Si puede acceder, devolver el embed
      // (El servicio ya validó los permisos y marcó isLocked correctamente)

      // Obtener embed HTML
      const embedHtml = await vimeoService.getEmbedHtml(lesson.vimeoVideoId);

      res.status(200).json({
        success: true,
        data: {
          embedHtml,
          videoId: lesson.vimeoVideoId,
          videoUrl: lesson.videoUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const lessonController = new LessonController();
