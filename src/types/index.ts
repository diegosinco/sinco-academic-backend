/**
 * Tipos centralizados del proyecto
 * 
 * Este archivo exporta todos los tipos organizados por dominio
 */

// Auth
export * from './auth.types';

// User
export * from './user.types';

// Course
export * from './course.types';

// Blog
export * from './blog.types';

// E-commerce
export * from './ecommerce.types';

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}


