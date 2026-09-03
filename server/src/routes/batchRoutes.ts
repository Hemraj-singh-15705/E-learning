import { Router } from 'express';
import {
  getBatches,
  createBatch,
  getBatch,
  updateBatch,
  updateBatchStatus,
  deleteBatch,
  duplicateBatch,
  addMentorToBatch,
  removeMentorFromBatch,
  addCourseToBatch,
  removeCourseFromBatch,
  enrollStudentToBatch,
  unenrollStudentFromBatch
} from '../controllers/batchController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication globally to batches routes
router.use(authenticate);

// List/read batches
router.get('/', getBatches);
router.get('/:id', getBatch);

// Admin-only operations
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createBatch);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateBatch);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), updateBatchStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteBatch);

// Duplication & Relationships
router.post('/:id/duplicate', authorize('SUPER_ADMIN', 'ADMIN'), duplicateBatch);

router.post('/:id/mentors', authorize('SUPER_ADMIN', 'ADMIN'), addMentorToBatch);
router.delete('/:id/mentors/:mentorId', authorize('SUPER_ADMIN', 'ADMIN'), removeMentorFromBatch);

router.post('/:id/courses', authorize('SUPER_ADMIN', 'ADMIN'), addCourseToBatch);
router.delete('/:id/courses/:courseId', authorize('SUPER_ADMIN', 'ADMIN'), removeCourseFromBatch);

router.post('/:id/enrollments', authorize('SUPER_ADMIN', 'ADMIN'), enrollStudentToBatch);
router.delete('/:id/enrollments/:studentId', authorize('SUPER_ADMIN', 'ADMIN'), unenrollStudentFromBatch);

export default router;
