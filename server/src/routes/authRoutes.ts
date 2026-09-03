import { Router } from 'express';
import {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  getMe,
  refreshToken
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema
} from '../validators/authValidator';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/refresh', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

// Protected routes (require valid JWT access token)
router.get('/me', authenticate, getMe);
router.patch('/update-password', authenticate, validate(updatePasswordSchema), updatePassword);

export default router;
