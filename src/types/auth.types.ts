/**
 * Tokens de autenticación
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * DTO para registro
 */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

/**
 * DTO para solicitar reset de contraseña
 */
export interface RequestPasswordResetDTO {
  email: string;
}

/**
 * DTO para resetear contraseña
 */
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

/**
 * DTO para refresh token
 */
export interface RefreshTokenDTO {
  refreshToken: string;
}

/**
 * Información del usuario autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}


