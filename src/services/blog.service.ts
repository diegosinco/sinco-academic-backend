import { prisma } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import type { BlogFilters, BlogListResponse, CreateBlogPostDTO, UpdateBlogPostDTO } from '../types';

export class BlogService {
  async getPosts(filters: BlogFilters = {}, includeUnpublished: boolean = false): Promise<BlogListResponse> {
    const {
      category,
      search,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Si no se incluyen no publicados, solo mostrar publicados
    if (!includeUnpublished) {
      where.isPublished = true;
    }

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
          isPublished: true, // Siempre incluir para que el frontend sepa el estado
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
        orderBy: includeUnpublished 
          ? { createdAt: 'desc' }  // Para admin: ordenar por fecha de creación
          : { publishedAt: 'desc' }, // Para público: ordenar por fecha de publicación
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

  /**
   * Obtener post por ID o slug
   * Útil para panel de administración donde se puede acceder por ID
   */
  async getPostByIdOrSlug(identifier: string, includeUnpublished: boolean = false) {
    // Detectar si es un ID (cuid format) o un slug
    // Los IDs de cuid tienen formato: c[letra][número]...
    const isId = /^c[a-z0-9]{24}$/.test(identifier);

    const where: any = isId 
      ? { id: identifier }
      : { slug: identifier };

    // Si no se incluyen no publicados, solo mostrar publicados
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    const post = await prisma.blogPost.findFirst({
      where,
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
      // Verificar si el post existe pero no está publicado
      const postExists = await prisma.blogPost.findFirst({
        where: isId ? { id: identifier } : { slug: identifier },
        select: { id: true, isPublished: true },
      });

      if (postExists && !postExists.isPublished) {
        throw new NotFoundError('Post no encontrado o no está publicado');
      }
      
      throw new NotFoundError(`Post no encontrado${isId ? ` con ID: ${identifier}` : ` con slug: ${identifier}`}`);
    }

    // Solo incrementar vistas si está publicado y se accedió por slug (público)
    if (post.isPublished && !isId) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      });
    }

    return post;
  }

  async getCategories() {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  /**
   * Crear un nuevo post de blog
   */
  async createPost(data: CreateBlogPostDTO, authorId: string) {
    // Verificar que la categoría existe
    const category = await prisma.blogCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new ValidationError('Categoría no encontrada');
    }

    // Verificar que el slug no existe
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });

    if (existingPost) {
      throw new ValidationError('Ya existe un post con ese slug');
    }

    // Crear post
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || null,
        categoryId: data.categoryId,
        featuredImage: data.featuredImage || null,
        tags: data.tags || [],
        authorId,
        isPublished: data.isPublished || false,
        publishedAt: data.isPublished ? new Date() : null,
      },
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

    return post;
  }

  /**
   * Actualizar un post de blog
   */
  async updatePost(postId: string, data: UpdateBlogPostDTO, userId: string, userRole: string) {
    // Verificar que el post existe
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post no encontrado');
    }

    // Verificar permisos: solo el autor o admin pueden editar
    if (post.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenError('No tienes permisos para editar este post');
    }

    // Si se actualiza la categoría, verificar que existe
    if (data.categoryId) {
      const category = await prisma.blogCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new ValidationError('Categoría no encontrada');
      }
    }

    // Si se actualiza el slug, verificar que no existe en otro post
    if (data.slug && data.slug !== post.slug) {
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: data.slug },
      });

      if (existingPost) {
        throw new ValidationError('Ya existe un post con ese slug');
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
      // Si se publica por primera vez, establecer publishedAt
      if (data.isPublished && !post.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // Actualizar post
    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
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

    return updatedPost;
  }

  /**
   * Eliminar un post de blog
   */
  async deletePost(postId: string, userId: string, userRole: string) {
    // Verificar que el post existe
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post no encontrado');
    }

    // Solo admin puede eliminar posts
    if (userRole !== 'admin') {
      throw new ForbiddenError('Solo los administradores pueden eliminar posts');
    }

    // Eliminar post
    await prisma.blogPost.delete({
      where: { id: postId },
    });

    return { message: 'Post eliminado exitosamente' };
  }

  /**
   * Actualizar el estado publicado/no publicado de un post de blog
   */
  async updatePostStatus(postId: string, isPublished: boolean) {
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post no encontrado');
    }

    const updateData: any = { isPublished };
    
    // Si se publica por primera vez, establecer publishedAt
    if (isPublished && !post.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
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

    return updatedPost;
  }
}

export const blogService = new BlogService();
