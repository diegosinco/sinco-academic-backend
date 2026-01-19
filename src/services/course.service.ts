import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import type { CourseFilters, CourseListResponse } from '../types';

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
}

export const courseService = new CourseService();
