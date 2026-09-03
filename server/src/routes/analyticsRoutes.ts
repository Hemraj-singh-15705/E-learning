import { Router } from 'express';
import {
  getAdminAnalytics,
  getStudentAnalytics,
  getMentorAnalytics,
  getBatchAnalytics
} from '../controllers/analyticsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// 1. Admin Platform Overview
router.get('/admin', authorize('SUPER_ADMIN', 'ADMIN'), getAdminAnalytics);

// 2. Student Learning Progress
router.get('/student', getStudentAnalytics);

// 3. Mentor Instruction & Cohorts
router.get('/mentor', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), getMentorAnalytics);

// 4. Specific Batch Cohort Deep-Dive
router.get('/batches/:batchId', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), getBatchAnalytics);

export default router;
