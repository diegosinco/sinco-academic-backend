import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import type { CourseFilters, CourseListResponse, CreateCourseDTO, UpdateCourseDTO } from '../types';

export class CourseService {
  async getCourses(filters: CourseFilters = {}): Promise<CourseListResponse> {
    const {
      category,
      level,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (category) {
      const categoryDoc = await prisma.courseCategory.findUnique({
        where: { slug: category },
      });
      if (categoryDoc) {
        where.categoryId = categoryDoc.id;
      }
    }

    if (level) {
      where.level = level;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCourseBySlug(slug: string) {
    const course = await prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    return course;
  }

  async getCategories() {
    const categories = await prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async createCourse(instructorId: string, data: CreateCourseDTO) {
    // Verificar que la categoría existe
    const category = await prisma.courseCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    // Verificar que el slug no exista
    const existingCourse = await prisma.course.findUnique({
      where: { slug: data.slug },
    });

    if (existingCourse) {
      throw new ConflictError('Ya existe un curso con este slug');
    }

    const course = await prisma.course.create({
      data: {
        ...data,
        instructorId,
        level: data.level || 'beginner',
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return course;
  }

  async updateCourse(courseId: string, userId: string, userRole: string, data: UpdateCourseDTO) {
    // Buscar el curso
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    // Verificar permisos: solo el instructor dueño o admin pueden actualizar
    if (course.instructorId !== userId && userRole !== 'admin') {
      throw new ForbiddenError('No tienes permisos para actualizar este curso');
    }

    // Si se está actualizando la categoría, verificar que existe
    if (data.categoryId) {
      const category = await prisma.courseCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundError('Categoría no encontrada');
      }
    }

    // Si se está actualizando el slug, verificar que no exista en otro curso
    if (data.slug && data.slug !== course.slug) {
      const existingCourse = await prisma.course.findUnique({
        where: { slug: data.slug },
      });

      if (existingCourse) {
        throw new ConflictError('Ya existe un curso con este slug');
      }
    }

    // Si se está publicando el curso, establecer publishedAt
    const updateData: any = { ...data };
    if (data.isPublished === true && !course.isPublished) {
      updateData.publishedAt = new Date();
    } else if (data.isPublished === false) {
      updateData.publishedAt = null;
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return updatedCourse;
  }

  async deleteCourse(courseId: string, _userId: string, userRole: string) {
    // Buscar el curso
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    // Solo admin puede eliminar cursos
    if (userRole !== 'admin') {
      throw new ForbiddenError('Solo los administradores pueden eliminar cursos');
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return { message: 'Curso eliminado exitosamente' };
  }

  async getCourseById(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    return course;
  }
}

export const courseService = new CourseService();
