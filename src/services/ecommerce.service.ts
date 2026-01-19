import { prisma } from '../config/database';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';

export class EcommerceService {
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          total: 0,
        },
        include: {
          items: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  image: true,
                  price: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addToCart(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    if (!course.isPublished) {
      throw new ValidationError('El curso no está disponible');
    }

    // Verificar si el usuario ya está inscrito
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (enrollment) {
      throw new ConflictError('Ya estás inscrito en este curso');
    }

    // Obtener o crear carrito
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, total: 0 },
      });
    }

    // Verificar si el curso ya está en el carrito
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_courseId: {
          cartId: cart.id,
          courseId,
        },
      },
    });

    if (existingItem) {
      throw new ConflictError('El curso ya está en el carrito');
    }

    // Agregar item al carrito
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        courseId,
        price: course.price,
      },
    });

    // Recalcular total
    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });
    const total = items.reduce((sum, item) => sum + item.price, 0);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { total },
    });

    // Retornar carrito con relaciones
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, courseId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundError('Carrito no encontrado');
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        courseId,
      },
    });

    // Recalcular total
    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });
    const total = items.reduce((sum, item) => sum + item.price, 0);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { total },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await prisma.cart.update({
        where: { id: cart.id },
        data: { total: 0 },
      });
    }
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundError('Cupón no válido o expirado');
    }

    if (!coupon.isActive) {
      throw new NotFoundError('Cupón no válido o expirado');
    }

    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      throw new NotFoundError('Cupón no válido o expirado');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ValidationError('Cupón agotado');
    }

    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      throw new ValidationError(`El total debe ser al menos $${coupon.minPurchase}`);
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = Math.min(coupon.value, subtotal);
    }

    return { discount, coupon };
  }

  async checkout(userId: string, couponCode?: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ValidationError('El carrito está vacío');
    }

    let subtotal = cart.total;
    let discount = 0;
    let couponId: string | undefined = undefined;

    if (couponCode) {
      const couponResult = await this.validateCoupon(couponCode, subtotal);
      discount = couponResult.discount;
      couponId = couponResult.coupon.id;

      // Incrementar contador de uso del cupón
      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = subtotal - discount;

    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Crear orden y enrollments en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear orden
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          subtotal,
          discount,
          couponId,
          total,
          status: 'completed',
          items: {
            create: cart.items.map((item) => ({
              courseId: item.courseId,
              title: item.course.title,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
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
          },
        },
      });

      // Crear enrollments
      const enrollments = await Promise.all(
        cart.items.map((item) =>
          tx.enrollment.create({
            data: {
              userId,
              courseId: item.courseId,
              orderId: order.id,
              progress: 0,
              certificateIssued: false,
            },
          })
        )
      );

      // Limpiar carrito
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { total: 0 },
      });

      return { order, enrollments };
    });

    return result;
  }

  async getOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }
}

export const ecommerceService = new EcommerceService();
