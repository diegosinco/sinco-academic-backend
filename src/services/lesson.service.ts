import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { vimeoService } from './vimeo.service';

// Helper para verificar si vimeoService está disponible
const getVimeoService = () => {
  if (!vimeoService) {
    throw new ValidationError('Servicio de Vimeo no está configurado. Verifica VIMEO_ACCESS_TOKEN.');
  }
  return vimeoService;
};

export class LessonService {
  /**
   * Obtiene todas las lecciones de un curso
   * @param courseId ID del curso
   * @param includeUnpublished Si incluir lecciones no publicadas (admin/instructor)
   * @param userId ID del usuario (opcional, para verificar inscripción)
   */
  async getLessonsByCourse(courseId: string, includeUnpublished = false, userId?: string): Promise<any[]> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    // Verificar si el usuario está inscrito
    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    // Construir condiciones de filtrado
    const where: any = { courseId };
    
    if (!includeUnpublished) {
      // Mostrar todas las lecciones publicadas (preview y no preview)
      // El frontend decidirá cuáles mostrar como bloqueadas
      where.isPublished = true;
    }
    // Si includeUnpublished es true (admin/instructor), no filtramos por isPublished

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        vimeoVideoId: true,
        videoUrl: true,
        duration: true,
        order: true,
        isPublished: true,
        isPreview: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Normalizar las lecciones y agregar campo isLocked
    return lessons.map((lesson) => {
      const normalized = this.normalizeLesson(lesson);
      
      // Determinar si está bloqueada
      // - Preview: nunca bloqueada
      // - No preview: bloqueada si no está inscrito (o no autenticado)
      const isLocked = !lesson.isPreview && !isEnrolled;
      
      return {
        ...normalized,
        isLocked,
        canAccess: !isLocked,
      };
    });
  }

  /**
   * Obtiene una lección por ID
   * @param lessonId ID de la lección
   * @param includeUnpublished Si incluir lecciones no publicadas (admin/instructor)
   * @param userId ID del usuario (opcional, para verificar inscripción)
   */
  async getLessonById(lessonId: string, includeUnpublished = false, userId?: string): Promise<any> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        vimeoVideoId: true,
        videoUrl: true,
        duration: true,
        order: true,
        isPublished: true,
        isPreview: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError('Lección no encontrada');
    }

    // Admin e instructores pueden ver todas las lecciones
    if (includeUnpublished) {
      const normalized = this.normalizeLesson(lesson);
      return {
        ...normalized,
        isLocked: false,
        canAccess: true,
      };
    }

    // Verificar si el usuario está inscrito
    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.courseId,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    // Si es preview, siempre visible (incluso sin autenticación)
    if (lesson.isPreview) {
      const normalized = this.normalizeLesson(lesson);
      return {
        ...normalized,
        isLocked: false,
        canAccess: true,
      };
    }

    // Si NO es preview y está publicada, devolverla pero marcarla como bloqueada si no está inscrito
    if (lesson.isPublished) {
      const normalized = this.normalizeLesson(lesson);
      const isLocked = !isEnrolled;
      return {
        ...normalized,
        isLocked,
        canAccess: !isLocked,
      };
    }

    // Si no está publicada y no está inscrito, no puede verla
    if (!isEnrolled) {
      throw new NotFoundError('Lección no encontrada');
    }

    const normalized = this.normalizeLesson(lesson);
    return {
      ...normalized,
      isLocked: false,
      canAccess: true,
    };
  }

  /**
   * Normaliza una lección para asegurar valores consistentes
   */
  private normalizeLesson(lesson: any): any {
    return {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description ?? null,
      vimeoVideoId: lesson.vimeoVideoId !== undefined ? lesson.vimeoVideoId : null, // Preservar el valor original, solo convertir undefined a null
      videoUrl: lesson.videoUrl || null,
      duration: lesson.duration ?? null,
      order: lesson.order ?? 0,
      isPublished: lesson.isPublished ?? false,
      isPreview: lesson.isPreview ?? false,
      createdAt: lesson.createdAt instanceof Date ? lesson.createdAt.toISOString() : lesson.createdAt,
      updatedAt: lesson.updatedAt instanceof Date ? lesson.updatedAt.toISOString() : lesson.updatedAt,
      ...(lesson.course && { course: lesson.course }),
    };
  }

  /**
   * Crea una nueva lección
   */
  async createLesson(
    courseId: string,
    data: {
      title: string;
      description?: string;
      vimeoVideoId?: string;
      videoUrl?: string;
      duration?: number;
      order?: number;
      isPublished?: boolean;
      isPreview?: boolean;
    },
    userId: string,
    userRole: string
  ): Promise<any> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    // Solo el instructor del curso o un admin pueden crear lecciones
    if (course.instructorId !== userId && userRole !== 'admin') {
      throw new ForbiddenError('No tienes permiso para crear lecciones en este curso');
    }

    // Si se proporciona un vimeoVideoId, validar que existe
    if (data.vimeoVideoId) {
      try {
        const vimeo = getVimeoService();
        await vimeo.getVideo(data.vimeoVideoId);
      } catch (error) {
        throw new ValidationError(`El video de Vimeo no existe o no es accesible: ${data.vimeoVideoId}`);
      }
    }

    // Si se proporciona una URL de Vimeo, extraer el ID
    if (data.videoUrl && !data.vimeoVideoId) {
      const vimeo = getVimeoService();
      const extractedId = vimeo.extractVideoIdFromUrl(data.videoUrl);
      if (extractedId) {
        data.vimeoVideoId = extractedId;
      }
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        vimeoVideoId: data.vimeoVideoId,
        videoUrl: data.videoUrl,
        duration: data.duration,
        order: data.order ?? 0,
        isPublished: data.isPublished ?? false,
        isPreview: data.isPreview ?? false,
      },
    });

    return lesson;
  }

  /**
   * Crea múltiples lecciones en lote
   */
  async createLessonsBatch(
    courseId: string,
    lessons: Array<{
      title: string;
      description?: string;
      vimeoVideoId?: string;
      videoUrl?: string;
      duration?: number;
      order?: number;
      isPublished?: boolean;
      isPreview?: boolean;
    }>,
    userId: string,
    userRole: string
  ): Promise<any[]> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    // Solo el instructor del curso o un admin pueden crear lecciones
    if (course.instructorId !== userId && userRole !== 'admin') {
      throw new ForbiddenError('No tienes permiso para crear lecciones en este curso');
    }

    // Validar y procesar cada lección
    const lessonsToCreate = await Promise.all(
      lessons.map(async (lessonData, index) => {
        // Si se proporciona un vimeoVideoId, validar que existe (opcional, puede fallar silenciosamente)
        if (lessonData.vimeoVideoId) {
          try {
            const vimeo = getVimeoService();
            await vimeo.getVideo(lessonData.vimeoVideoId);
          } catch (error) {
            console.warn(`Video de Vimeo ${lessonData.vimeoVideoId} no encontrado, continuando...`);
          }
        }

        // Si se proporciona una URL de Vimeo, extraer el ID
        if (lessonData.videoUrl && !lessonData.vimeoVideoId) {
          const vimeo = getVimeoService();
          const extractedId = vimeo.extractVideoIdFromUrl(lessonData.videoUrl);
          if (extractedId) {
            lessonData.vimeoVideoId = extractedId;
          }
        }

        return {
          courseId,
          title: lessonData.title,
          description: lessonData.description,
          vimeoVideoId: lessonData.vimeoVideoId,
          videoUrl: lessonData.videoUrl,
          duration: lessonData.duration,
          order: lessonData.order ?? index,
          isPublished: lessonData.isPublished ?? false,
          isPreview: lessonData.isPreview ?? false,
        };
      })
    );

    // Crear todas las lecciones en una transacción
    const createdLessons = await prisma.$transaction(
      lessonsToCreate.map((data) =>
        prisma.lesson.create({
          data,
        })
      )
    );

    return createdLessons;
  }

  /**
   * Actualiza una lección
   */
  async updateLesson(
    lessonId: string,
    data: {
      title?: string;
      description?: string;
      vimeoVideoId?: string;
      videoUrl?: string;
      duration?: number;
      order?: number;
      isPublished?: boolean;
      isPreview?: boolean;
    },
    userId: string,
    userRole: string
  ): Promise<any> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError('Lección no encontrada');
    }

    // Solo el instructor del curso o un admin pueden actualizar lecciones
    if (lesson.course.instructorId !== userId && userRole !== 'admin') {
      throw new ForbiddenError('No tienes permiso para actualizar esta lección');
    }

    // Si se proporciona un vimeoVideoId, validar que existe
    if (data.vimeoVideoId) {
      try {
        const vimeo = getVimeoService();
        await vimeo.getVideo(data.vimeoVideoId);
      } catch (error) {
        throw new ValidationError(`El video de Vimeo no existe o no es accesible: ${data.vimeoVideoId}`);
      }
    }

    // Si se proporciona una URL de Vimeo, extraer el ID
    if (data.videoUrl && !data.vimeoVideoId) {
      const vimeo = getVimeoService();
      const extractedId = vimeo.extractVideoIdFromUrl(data.videoUrl);
      if (extractedId) {
        data.vimeoVideoId = extractedId;
      }
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data,
    });

    return updatedLesson;
  }

  /**
   * Elimina una lección
   */
  async deleteLesson(lessonId: string, userId: string, userRole: string): Promise<void> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError('Lección no encontrada');
    }

    // Solo el instructor del curso o un admin pueden eliminar lecciones
    if (lesson.course.instructorId !== userId && userRole !== 'admin') {
      throw new ForbiddenError('No tienes permiso para eliminar esta lección');
    }

    // Si tiene un video en Vimeo, eliminarlo también
    if (lesson.vimeoVideoId) {
      try {
        const vimeo = getVimeoService();
        await vimeo.deleteVideo(lesson.vimeoVideoId);
      } catch (error) {
        // Si el video no existe en Vimeo, continuar con la eliminación de la lección
        console.warn(`No se pudo eliminar el video de Vimeo ${lesson.vimeoVideoId}:`, error);
      }
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });
  }
}

export const lessonService = new LessonService();
