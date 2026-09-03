import { Router } from 'express';
import {
  getAdminDashboardStats,
  listUsers,
  getUserProfile,
  updateUserProfile,
  toggleUserStatus
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply administrative protections globally to these endpoints
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

router.get('/stats', getAdminDashboardStats);
router.get('/users', listUsers);
router.get('/users/:id', getUserProfile);
router.patch('/users/:id', updateUserProfile);
router.patch('/users/:id/status', toggleUserStatus);

export default router;
