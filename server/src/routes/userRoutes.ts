import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  updateProfile,
  deleteUser
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication universally to users endpoint
router.use(authenticate);

// Profile detail retrieval and updates
router.get('/:id', getUser);
router.patch('/:id', updateProfile);

// Administrative operations
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getAllUsers);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteUser);

export default router;
