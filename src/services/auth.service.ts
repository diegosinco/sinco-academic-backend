import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import type { AuthTokens, LoginCredentials, RegisterDTO } from '../types';

// Mantener compatibilidad con código existente
export type { AuthTokens, LoginCredentials };
export type RegisterData = RegisterDTO;

export class AuthService {
  private generateAccessToken(
    userId: string,
    email: string,
    role: string,
    name: string,
    avatar: string | null
  ): string {
    return jwt.sign(
      { id: userId, email, role, name, avatar },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  async register(data: RegisterDTO): Promise<AuthTokens> {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

    // Hash de contraseña
    const hashedPassword = await hashPassword(data.password);

    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    // Generar tokens
    const accessToken = this.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.name,
      user.avatar
    );
    const refreshToken = this.generateRefreshToken(user.id);

    // Guardar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const isPasswordValid = await comparePassword(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar tokens
    const accessToken = this.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.name,
      user.avatar
    );
    const refreshToken = this.generateRefreshToken(user.id);

    // Guardar refresh token (eliminar tokens anteriores del usuario)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    // Eliminar tokens anteriores del usuario (opcional: puedes mantener múltiples sesiones)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as { id: string };

      // Verificar que el token existe en la base de datos
      const refreshTokenDoc = await prisma.refreshToken.findFirst({
        where: {
          token,
          userId: decoded.id,
          expiresAt: { gt: new Date() },
        },
      });

      if (!refreshTokenDoc) {
        throw new UnauthorizedError('Refresh token inválido o expirado');
      }

      // Obtener usuario
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (!user) {
        throw new NotFoundError('Usuario no encontrado');
      }

      // Generar nuevo access token
      const accessToken = this.generateAccessToken(
        user.id,
        user.email,
        user.role,
        user.name,
        user.avatar
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Refresh token inválido');
      }
      throw error;
    }
  }

  async logout(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return;
    }

    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    });

    // TODO: Enviar email con el resetToken (no el hash)
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const crypto = await import('crypto');
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Token de recuperación inválido o expirado');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }
}

export const authService = new AuthService();
