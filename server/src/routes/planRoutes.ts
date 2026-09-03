import { Router } from 'express';
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan
} from '../controllers/planController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public / Authenticated Plan routes
router.get('/', getPlans);
router.get('/:id', getPlan);

// Admin plan management
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), createPlan);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), updatePlan);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deletePlan);

export default router;
