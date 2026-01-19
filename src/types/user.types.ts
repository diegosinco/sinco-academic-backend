import { UserRole } from '@prisma/client';

/**
 * Usuario sin información sensible (para respuestas públicas)
 */
export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  phone: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Usuario completo (solo para admin)
 */
export interface UserFull extends UserPublic {
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
}

/**
 * DTO para actualizar perfil
 */
export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Usuario con información básica (para listados)
 */
export interface UserBasic {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

/**
 * Usuario instructor (para mostrar en cursos)
 */
export interface InstructorInfo {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}


