import { Router } from 'express';
import {
  getTests,
  createTest,
  getTest,
  updateTest,
  updateTestStatus,
  deleteTest,
  addQuestionToTest,
  updateQuestion,
  deleteQuestionFromTest,
  reorderQuestions,
  getTestAnalytics
} from '../controllers/testController';
import {
  getBankQuestions,
  createBankQuestion,
  updateBankQuestion,
  deleteBankQuestion,
  importBankQuestionsToTest
} from '../controllers/questionBankController';
import {
  startOrResumeAttempt,
  saveDraftAnswers,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
  getAllAttemptsForTest,
  gradeSubjectiveAnswer
} from '../controllers/testAttemptController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all test routes
router.use(authenticate);

// ==========================================
// 1. QUESTION BANK ROUTES (Admin / Mentor)
// ==========================================
router.get('/questions/bank', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), getBankQuestions);
router.post('/questions/bank', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), createBankQuestion);
router.put('/questions/bank/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateBankQuestion);
router.delete('/questions/bank/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), deleteBankQuestion);
router.post('/questions/bank/import-to-test', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), importBankQuestionsToTest);

// Individual Question Update (Admin/Mentor)
router.put('/questions/:questionId', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateQuestion);

// ==========================================
// 2. TEST ATTEMPT / TAKING ROUTES (Student & All)
// ==========================================
router.post('/:id/start', startOrResumeAttempt);
router.get('/:id/my-attempts', getMyAttempts);
router.patch('/attempts/:attemptId/save-answers', saveDraftAnswers);
router.post('/attempts/:attemptId/submit', submitAttempt);
router.get('/attempts/:attemptId/result', getAttemptResult);

// Evaluation / Submissions (Admin / Mentor)
router.get('/:id/all-attempts', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), getAllAttemptsForTest);
router.post('/attempts/:attemptId/grade-subjective', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), gradeSubjectiveAnswer);

// ==========================================
// 3. TEST CRUD & MANAGEMENT ROUTES
// ==========================================
router.get('/', getTests);
router.get('/:id', getTest);
router.get('/:id/analytics', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), getTestAnalytics);

// Admin & Mentor Test Authoring
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), createTest);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateTest);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateTestStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), deleteTest);

// Inline Test Questions Management
router.post('/:id/questions', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), addQuestionToTest);
router.delete('/:id/questions/:questionId', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), deleteQuestionFromTest);
router.put('/:id/questions/reorder', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), reorderQuestions);

export default router;
