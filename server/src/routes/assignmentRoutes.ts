import { Router } from 'express';
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions
} from '../controllers/assignmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// 1. Assignment CRUD
router.get('/', getAssignments);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), createAssignment);

// 2. Single Assignment & Submissions
router.get('/:id', getAssignment);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateAssignment);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), deleteAssignment);

// 3. Student Submission & Grading
router.post('/:id/submit', authorize('STUDENT'), submitAssignment);
router.get('/:id/submissions', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), getAssignmentSubmissions);
router.post(
  '/submissions/:submissionId/grade',
  authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'),
  gradeSubmission
);

export default router;
