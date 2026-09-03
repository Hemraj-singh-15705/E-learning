import { Router } from 'express';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/couponController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Validate coupon during checkout
router.post('/validate', authenticate, validateCoupon);

// Admin Coupon Management
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getCoupons);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), createCoupon);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), updateCoupon);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deleteCoupon);

export default router;
