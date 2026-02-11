import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

export class LessonProgressService {
  /**
   * Helper privado: Verifica que el estudiante esté inscrito en el curso
   * @throws ForbiddenError si no está inscrito
   */
  private async verifyEnrollment(userId: string, courseId: string): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenError('No estás inscrito en este curso');
    }
  }

  /**
   * Obtiene el progreso de un estudiante en una lección específica
   */
  async getProgress(userId: string, lessonId: string): Promise<any> {
    // Obtener la lección para verificar el curso
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });

    if (!lesson) {
      throw new NotFoundError('Lección no encontrada');
    }

    // Verificar que el estudiante esté inscrito en el curso
    await this.verifyEnrollment(userId, lesson.courseId);

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            courseId: true,
          },
        },
      },
    });

    return progress;
  }

  /**
   * Obtiene todo el progreso de un estudiante en un curso
   */
  async getCourseProgress(userId: string, courseId: string): Promise<any[]> {
    // Verificar que el estudiante esté inscrito en el curso
    await this.verifyEnrollment(userId, courseId);

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          courseId,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            isPublished: true,
          },
        },
      },
      orderBy: {
        lesson: {
          order: 'asc',
        },
      },
    });

    return progress;
  }

  /**
   * Actualiza o crea el progreso de un estudiante en una lección
   */
  async updateProgress(
    userId: string,
    lessonId: string,
    data: {
      completed?: boolean;
      progress?: number;
      lastPosition?: number;
      timeSpent?: number;
    }
  ): Promise<any> {
    // Verificar que la lección existe y está publicada
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundError('Lección no encontrada');
    }

    if (!lesson.isPublished) {
      throw new ForbiddenError('Esta lección no está publicada');
    }

    // Verificar que el estudiante esté inscrito en el curso
    await this.verifyEnrollment(userId, lesson.course.id);

    // Validar datos
    if (data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
      throw new ValidationError('El progreso debe estar entre 0 y 100');
    }

    if (data.lastPosition !== undefined && data.lastPosition < 0) {
      throw new ValidationError('La posición no puede ser negativa');
    }

    if (data.timeSpent !== undefined && data.timeSpent < 0) {
      throw new ValidationError('El tiempo visto no puede ser negativo');
    }

    // Si se marca como completada, actualizar progreso a 100
    const updateData: any = { ...data };
    if (data.completed === true) {
      updateData.progress = 100;
      updateData.completedAt = new Date();
    } else if (data.completed === false) {
      updateData.completedAt = null;
    }

    // Upsert: crear o actualizar
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        completed: updateData.completed ?? false,
        completedAt: updateData.completedAt ?? null,
        progress: updateData.progress ?? 0,
        lastPosition: updateData.lastPosition ?? null,
        timeSpent: updateData.timeSpent ?? 0,
      },
      update: updateData,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            duration: true,
            order: true,
          },
        },
      },
    });

    // Actualizar el progreso general del curso en Enrollment
    await this.updateCourseProgress(userId, lesson.course.id);

    return progress;
  }

  /**
   * Calcula y actualiza el progreso general del curso en Enrollment
   */
  private async updateCourseProgress(userId: string, courseId: string): Promise<void> {
    // Obtener todas las lecciones publicadas del curso
    const totalLessons = await prisma.lesson.count({
      where: {
        courseId,
        isPublished: true,
      },
    });

    if (totalLessons === 0) {
      return;
    }

    // Obtener lecciones completadas por el estudiante
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        lesson: {
          courseId,
          isPublished: true,
        },
        completed: true,
      },
    });

    // Calcular porcentaje de progreso
    const progress = Math.round((completedLessons / totalLessons) * 100);

    // Actualizar Enrollment
    await prisma.enrollment.updateMany({
      where: {
        userId,
        courseId,
      },
      data: {
        progress,
        completedAt: progress === 100 ? new Date() : null,
      },
    });
  }

  /**
   * Marca una lección como completada
   */
  async markAsCompleted(userId: string, lessonId: string): Promise<any> {
    return this.updateProgress(userId, lessonId, { completed: true });
  }

  /**
   * Obtiene estadísticas de progreso de un curso para un estudiante
   */
  async getCourseStats(userId: string, courseId: string): Promise<{
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    notStartedLessons: number;
    overallProgress: number;
    totalTimeSpent: number;
  }> {
    // Verificar inscripción
    await this.verifyEnrollment(userId, courseId);

    // Obtener todas las lecciones publicadas
    const totalLessons = await prisma.lesson.count({
      where: {
        courseId,
        isPublished: true,
      },
    });

    // Obtener progreso del estudiante
    const progressRecords = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          courseId,
          isPublished: true,
        },
      },
    });

    const completedLessons = progressRecords.filter((p) => p.completed).length;
    const inProgressLessons = progressRecords.filter(
      (p) => !p.completed && p.progress > 0
    ).length;
    const notStartedLessons = totalLessons - progressRecords.length;
    const overallProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
    const totalTimeSpent = progressRecords.reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0
    );

    return {
      totalLessons,
      completedLessons,
      inProgressLessons,
      notStartedLessons,
      overallProgress,
      totalTimeSpent,
    };
  }
}

export const lessonProgressService = new LessonProgressService();
