import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import type { BlogFilters, BlogListResponse } from '../types';

export class BlogService {
  async getPosts(filters: BlogFilters = {}): Promise<BlogListResponse> {
    const {
      category,
      search,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (category) {
      const categoryDoc = await prisma.blogCategory.findUnique({
        where: { slug: category },
      });
      if (categoryDoc) {
        where.categoryId = categoryDoc.id;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          tags: true,
          views: true,
          publishedAt: true,
          createdAt: true,
          author: {
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
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostBySlug(slug: string) {
    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
      include: {
        author: {
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

    if (!post) {
      throw new NotFoundError('Post no encontrado');
    }

    // Incrementar vistas
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return post;
  }

  async getCategories() {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return categories;
  }
}

export const blogService = new BlogService();
