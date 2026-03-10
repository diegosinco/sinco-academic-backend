import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export interface CreateContentElementDTO {
  type: string;
  key: string;
  title?: string;
  data: object;
  isActive?: boolean;
}

export interface UpdateContentElementDTO {
  type?: string;
  key?: string;
  title?: string;
  data?: object;
  isActive?: boolean;
}

export const contentService = {
  /**
   * List active elements (public). Optional filter by type.
   */
  async getActive(type?: string) {
    const where: { isActive: boolean; type?: string } = { isActive: true };
    if (type) where.type = type;

    return prisma.contentElement.findMany({
      where,
      orderBy: { key: 'asc' },
    });
  },

  /**
   * Get one element by key (public).
   */
  async getByKey(key: string) {
    const el = await prisma.contentElement.findFirst({
      where: { key, isActive: true },
    });
    if (!el) throw new NotFoundError('Content element not found');
    return el;
  },

  /**
   * List all elements (admin). Optional filter by type.
   */
  async getAll(type?: string) {
    const where = type ? { type } : {};
    return prisma.contentElement.findMany({
      where,
      orderBy: { key: 'asc' },
    });
  },

  /**
   * Get by id (admin).
   */
  async getById(id: string) {
    const el = await prisma.contentElement.findUnique({
      where: { id },
    });
    if (!el) throw new NotFoundError('Content element not found');
    return el;
  },

  async create(data: CreateContentElementDTO) {
    return prisma.contentElement.upsert({
      where: { key: data.key },
      update: {
        type: data.type,
        title: data.title,
        data: data.data as object,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      create: {
        type: data.type,
        key: data.key,
        title: data.title,
        data: data.data as object,
        isActive: data.isActive ?? true,
      },
    });
  },

  async update(id: string, data: UpdateContentElementDTO) {
    await this.getById(id);
    return prisma.contentElement.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.key !== undefined && { key: data.key }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.data !== undefined && { data: data.data as object }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.contentElement.delete({ where: { id } });
  },
};
