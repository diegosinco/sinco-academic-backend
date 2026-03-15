import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface CreateCategoryDiscountDTO {
  categoryId: string;
  tiers: Record<string, number>; // { "1": 25, "2": 30, "3": 35, ... }
}

export interface UpdateCategoryDiscountDTO {
  tiers?: Record<string, number>;
}

export class CategoryDiscountService {
  async getAll() {
    return prisma.categoryDiscount.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { category: { name: 'asc' } },
    });
  }

  async getById(id: string) {
    const discount = await prisma.categoryDiscount.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    if (!discount) throw new NotFoundError('Descuento de categoría no encontrado');
    return discount;
  }

  async getByCategoryId(categoryId: string) {
    const discount = await prisma.categoryDiscount.findUnique({
      where: { categoryId },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    if (!discount) throw new NotFoundError('Descuento de categoría no encontrado');
    return discount;
  }

  async create(data: CreateCategoryDiscountDTO) {
    const category = await prisma.courseCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw new NotFoundError('Categoría no encontrada');

    const existing = await prisma.categoryDiscount.findUnique({
      where: { categoryId: data.categoryId },
    });
    if (existing) {
      throw new ConflictError(`Ya existe un descuento para la categoría "${category.name}"`);
    }

    return prisma.categoryDiscount.create({
      data: {
        categoryId: data.categoryId,
        tiers: data.tiers as object,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateCategoryDiscountDTO) {
    const discount = await prisma.categoryDiscount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundError('Descuento de categoría no encontrado');

    return prisma.categoryDiscount.update({
      where: { id },
      data: {
        ...(data.tiers !== undefined && { tiers: data.tiers as object }),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async delete(id: string) {
    const discount = await prisma.categoryDiscount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundError('Descuento de categoría no encontrado');

    await prisma.categoryDiscount.delete({ where: { id } });
  }
}

export const categoryDiscountService = new CategoryDiscountService();
