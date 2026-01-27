import { prisma } from '../config/database';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { hashPassword, comparePassword } from '../utils/password';

export class UserService {
  async getUserProfile(userId: string) {
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

  async getEnrolledCourses(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            price: true,
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments;
  }

  async getCertificates(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        certificateIssued: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return enrollments;
  }

  async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
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

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Validar contraseña actual
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Contraseña actual incorrecta');
    }

    // Validar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      throw new ValidationError('La nueva contraseña debe ser diferente a la actual');
    }

    // Hash de nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }
}

export const userService = new UserService();
