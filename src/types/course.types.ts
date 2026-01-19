import { CourseLevel } from '@prisma/client';

/**
 * Categoría de curso
 */
export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Curso completo con relaciones
 */
export interface CourseFull {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  instructorId: string;
  categoryId: string;
  price: number;
  image: string | null;
  level: CourseLevel;
  duration: number | null;
  rating: number;
  reviewsCount: number;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  instructor: {
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
 * Curso para listado (con información mínima)
 */
export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  image: string | null;
  level: CourseLevel;
  duration: number | null;
  rating: number;
  reviewsCount: number;
  instructor: {
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
 * Filtros para búsqueda de cursos
 */
export interface CourseFilters {
  category?: string;
  level?: CourseLevel | string; // Permite string para queries HTTP
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

/**
 * Respuesta de listado de cursos
 */
export interface CourseListResponse {
  courses: CourseListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * DTO para crear curso
 */
export interface CreateCourseDTO {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  price: number;
  image?: string;
  level?: CourseLevel;
  duration?: number;
}

/**
 * DTO para actualizar curso
 */
export interface UpdateCourseDTO {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  price?: number;
  image?: string;
  level?: CourseLevel;
  duration?: number;
  isPublished?: boolean;
}

/**
 * Curso inscrito por usuario
 */
export interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  price: number;
  instructor: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  enrollment: {
    id: string;
    enrolledAt: Date;
    progress: number;
    certificateIssued: boolean;
    completedAt: Date | null;
  };
}

