import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  color?: string | null;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  color?: string | null;
}

export class CategoryService {
  async getAll() {
    return prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const category = await prisma.courseCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { courses: true } },
      },
    });
    if (!category) throw new NotFoundError('Categoría no encontrada');
    return category;
  }

  async getBySlug(slug: string) {
    const category = await prisma.courseCategory.findUnique({
      where: { slug },
    });
    if (!category) throw new NotFoundError('Categoría no encontrada');
    return category;
  }

  async create(data: CreateCategoryDTO) {
    const existing = await prisma.courseCategory.findUnique({
      where: { slug: data.slug },
    });
    if (existing) throw new ConflictError(`Ya existe una categoría con el slug "${data.slug}"`);

    return prisma.courseCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        image: data.image ?? null,
        color: data.color ?? null,
      },
    });
  }

  async update(id: string, data: UpdateCategoryDTO) {
    const category = await prisma.courseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Categoría no encontrada');

    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.courseCategory.findUnique({
        where: { slug: data.slug },
      });
      if (existing) throw new ConflictError(`Ya existe una categoría con el slug "${data.slug}"`);
    }

    return prisma.courseCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }

  async delete(id: string) {
    const category = await prisma.courseCategory.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
    if (!category) throw new NotFoundError('Categoría no encontrada');
    if (category._count.courses > 0) {
      throw new ConflictError(
        `No se puede eliminar: hay ${category._count.courses} curso(s) en esta categoría`
      );
    }

    await prisma.courseCategory.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
