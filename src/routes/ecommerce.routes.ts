import { Router } from 'express';
import Joi from 'joi';
import { ecommerceController } from '../controllers/ecommerce.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// Todas las rutas requieren autenticación excepto validateCoupon
const addToCartSchema = Joi.object({
  courseId: Joi.string().required(),
});

const validateCouponSchema = Joi.object({
  code: Joi.string().required(),
  subtotal: Joi.number().min(0).required(),
});

const checkoutSchema = Joi.object({
  couponCode: Joi.string().optional(),
});

router.use(authenticate);

router.get('/cart', ecommerceController.getCart.bind(ecommerceController));
router.post('/cart', validateRequest(addToCartSchema), ecommerceController.addToCart.bind(ecommerceController));
router.delete('/cart/:courseId', ecommerceController.removeFromCart.bind(ecommerceController));
router.delete('/cart', ecommerceController.clearCart.bind(ecommerceController));
router.post('/coupons/validate', validateRequest(validateCouponSchema), ecommerceController.validateCoupon.bind(ecommerceController));
router.post('/checkout', validateRequest(checkoutSchema), ecommerceController.checkout.bind(ecommerceController));
router.get('/orders', ecommerceController.getOrders.bind(ecommerceController));

export default router;



