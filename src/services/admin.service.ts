import { prisma } from '../config/database';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import type { UserPublic } from '../types';
import { hashPassword } from '../utils/password';

export class AdminService {
  /**
   * Verificar si el usuario es admin
   */
  async verifyAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'admin';
  }

  /**
   * Crear un nuevo usuario (solo admin)
   */
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    avatar?: string;
    isEmailVerified?: boolean;
  }): Promise<UserPublic> {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

    // Validar que el rol sea válido
    if (data.role && !['student', 'instructor', 'admin'].includes(data.role)) {
      throw new ValidationError('Rol inválido');
    }

    // Hash de contraseña
    const hashedPassword = await hashPassword(data.password);

    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'student',
        phone: data.phone,
        avatar: data.avatar,
        isEmailVerified: data.isEmailVerified || false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Obtener todos los usuarios (paginado)
   */
  async getAllUsers(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          phone: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(userId: string): Promise<UserPublic> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualizar el rol de un usuario
   */
  async updateUserRole(userId: string, role: UserRole) {
    // Validar que el rol es válido
    if (!['student', 'instructor', 'admin'].includes(role)) {
      throw new ValidationError('Rol inválido');
    }

    // No permitir cambiar el rol del mismo admin (seguridad)
    // Esto se maneja mejor en el controlador

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Actualizar un usuario (campos generales, no password ni email)
   */
  async updateUser(userId: string, data: { name?: string; phone?: string; avatar?: string; isEmailVerified?: boolean }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Eliminar un usuario (soft delete o hard delete según necesidad)
   */
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Hard delete - eliminar completamente
    // En producción podrías hacer soft delete
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Obtener estadísticas generales
   */
  async getStats() {
    const [totalUsers, totalCourses, totalOrders, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.aggregate({
        where: { status: 'completed' },
        _sum: { total: true },
      }),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  }
}

export const adminService = new AdminService();


