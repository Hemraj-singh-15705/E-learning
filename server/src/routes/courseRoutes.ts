import { Router } from 'express';
import {
  getCourses,
  createCourse,
  getCourse,
  updateCourse,
  updateCourseStatus,
  deleteCourse
} from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication globally to courses routes
router.use(authenticate);

// Publicly read courses (for student browsing/dashboard)
router.get('/', getCourses);
router.get('/:id', getCourse);

// Admin-only updates
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createCourse);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateCourse);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), updateCourseStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteCourse);

export default router;
