import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

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
}

export const userService = new UserService();
