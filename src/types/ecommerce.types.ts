import { OrderStatus, CouponType } from '@prisma/client';

/**
 * Item del carrito
 */
export interface CartItem {
  id: string;
  courseId: string;
  price: number;
  course: {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    price: number;
  };
}

/**
 * Carrito completo
 */
export interface Cart {
  id: string;
  userId: string;
  total: number;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cupón
 */
export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para validar cupón
 */
export interface ValidateCouponDTO {
  code: string;
  subtotal: number;
}

/**
 * Item de orden
 */
export interface OrderItem {
  id: string;
  orderId: string;
  courseId: string;
  price: number;
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

/**
 * Orden completa
 */
export interface Order {
  id: string;
  userId: string;
  total: number;
  subtotal: number;
  discount: number;
  couponId: string | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  coupon?: Coupon | null;
}

/**
 * DTO para checkout
 */
export interface CheckoutDTO {
  couponCode?: string;
}

/**
 * Respuesta de checkout
 */
export interface CheckoutResponse {
  order: Order;
  message: string;
}

/**
 * Inscripción a curso
 */
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number;
  certificateIssued: boolean;
  completedAt: Date | null;
  course: {
    id: string;
    title: string;
    slug: string;
    image: string | null;
  };
}

/**
 * Certificado
 */
export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: Date;
  course: {
    id: string;
    title: string;
    slug: string;
    image: string | null;
  };
  enrollment: {
    completedAt: Date;
    progress: number;
  };
}


