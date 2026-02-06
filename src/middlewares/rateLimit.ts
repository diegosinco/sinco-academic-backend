import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * Rate limiter general para toda la API
 * 100 requests por 15 minutos por IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
  },
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Desactiva `X-RateLimit-*` headers
});

/**
 * Rate limiter estricto para endpoints de autenticación
 * Previene ataques de fuerza bruta
 * En desarrollo: 50 intentos por 15 minutos (más permisivo)
 * En producción: 5 intentos por 15 minutos
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Más permisivo en desarrollo
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Por favor intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos (solo fallidos)
});

/**
 * Rate limiter para endpoints de recuperación de contraseña
 * Muy estricto para prevenir spam de emails
 * 3 requests por hora por IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 solicitudes de reset por hora
  message: {
    success: false,
    message: 'Demasiadas solicitudes de recuperación de contraseña. Por favor intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para endpoints de creación/edición
 * Previene spam de contenido
 * 10 requests por 15 minutos por IP
 */
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 creaciones/ediciones por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes de creación. Por favor intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para endpoints de admin
 * Más permisivo pero aún protegido
 * 50 requests por 15 minutos por IP
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes al panel de administración. Por favor intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para endpoints públicos (cursos, blog)
 * Más permisivo para permitir navegación normal
 * 200 requests por 15 minutos por IP
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
