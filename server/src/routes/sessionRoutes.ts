import { Router } from 'express';
import {
  getSessions,
  getSession,
  createSession,
  updateSession,
  updateSessionStatus,
  updateSessionNotes,
  deleteSession,
  getDashboardSessionsSummary
} from '../controllers/sessionController';
import {
  getSessionAttendance,
  markSessionAttendance,
  getStudentAttendanceSummary
} from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all session and attendance endpoints
router.use(authenticate);

// 1. Dashboard and Student summary routes (placed before /:id param routes)
router.get('/dashboard-summary', getDashboardSessionsSummary);
router.get('/attendance/summary', getStudentAttendanceSummary);

// 2. Mentorship Sessions List & Query
router.get('/', getSessions);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), createSession);

// 3. Single Session Details & Updates
router.get('/:id', getSession);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateSession);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateSessionStatus);
router.patch('/:id/notes', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateSessionNotes);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), deleteSession);

// 4. Session Attendance Routes
router.get('/:sessionId/attendance', getSessionAttendance);
router.post(
  '/:sessionId/attendance',
  authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'),
  markSessionAttendance
);

export default router;
