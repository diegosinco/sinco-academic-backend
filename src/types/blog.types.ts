/**
 * Categoría de blog
 */
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Post de blog completo con relaciones
 */
export interface BlogPostFull {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  authorId: string;
  categoryId: string;
  featuredImage: string | null;
  tags: string[];
  views: number;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Post de blog para listado (sin contenido completo)
 */
export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  tags: string[];
  views: number;
  publishedAt: Date | null;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Filtros para búsqueda de posts
 */
export interface BlogFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Respuesta de listado de posts
 */
export interface BlogListResponse {
  posts: BlogPostListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * DTO para crear post
 */
export interface CreateBlogPostDTO {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId: string;
  featuredImage?: string;
  tags?: string[];
  isPublished?: boolean;
}

/**
 * DTO para actualizar post
 */
export interface UpdateBlogPostDTO {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
  featuredImage?: string;
  tags?: string[];
  isPublished?: boolean;
}


