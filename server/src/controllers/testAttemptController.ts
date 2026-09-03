import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Test from '../models/Test';
import Question from '../models/Question';
import TestAttempt from '../models/TestAttempt';
import Enrollment from '../models/Enrollment';
import Batch from '../models/Batch';
import { AppError } from '../utils/errors';
import { IQuestionSnapshot } from '../types/test';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// 1. Start or Resume an Attempt
export const startOrResumeAttempt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;

    const test = await Test.findById(id).populate({
      path: 'questions',
      options: { sort: { order: 1 } }
    });

    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    if (test.status !== 'PUBLISHED') {
      next(new AppError('This test is not published or currently active.', 403));
      return;
    }

    // Schedule window checks
    const now = new Date();
    if (test.startTime && now < new Date(test.startTime)) {
      next(new AppError(`This test will be available starting ${new Date(test.startTime).toLocaleString()}.`, 403));
      return;
    }
    if (test.endTime && now > new Date(test.endTime)) {
      next(new AppError(`This test window closed on ${new Date(test.endTime).toLocaleString()}.`, 403));
      return;
    }

    // Access control: verify batch / course enrollment if restricted
    if (test.batch || test.course) {
      let isAllowed = false;

      if (test.batch) {
        const enrollment = await Enrollment.findOne({
          student: studentId,
          batch: test.batch,
          status: 'ACTIVE'
        });
        if (enrollment) isAllowed = true;
      }

      if (!isAllowed && test.course) {
        const studentBatches = await Enrollment.find({
          student: studentId,
          status: 'ACTIVE'
        }).select('batch');
        const batchIds = studentBatches.map((b) => b.batch);
        const matchingBatches = await Batch.find({
          _id: { $in: batchIds },
          courses: test.course
        });
        if (matchingBatches.length > 0) isAllowed = true;
      }

      if (!isAllowed && req.user?.role === 'STUDENT') {
        next(new AppError('You do not have access to this test. Please check your course/batch enrollment.', 403));
        return;
      }
    }

    // Check for existing active attempt
    const activeAttempt = await TestAttempt.findOne({
      student: studentId,
      test: test._id,
      status: 'IN_PROGRESS'
    });

    if (activeAttempt) {
      // Check if active attempt deadline has passed
      const gracePeriodMs = 30 * 1000;
      if (new Date() > new Date(activeAttempt.deadline.getTime() + gracePeriodMs)) {
        // Auto-finalize the expired attempt
        await autoSubmitAttemptInternal(activeAttempt._id.toString());
      } else {
        res.status(200).json({
          success: true,
          message: 'Active attempt resumed.',
          data: {
            attemptId: activeAttempt._id,
            test: {
              _id: test._id,
              title: test.title,
              description: test.description,
              instructions: test.instructions,
              duration: test.duration,
              totalMarks: test.totalMarks,
              passingMarks: test.passingMarks,
              sections: test.sections,
              negativeMarking: test.negativeMarking,
              negativeMarkValue: test.negativeMarkValue
            },
            questions: activeAttempt.questionsSnapshot,
            answers: activeAttempt.answers,
            startedAt: activeAttempt.startedAt,
            deadline: activeAttempt.deadline,
            timeRemainingSeconds: Math.max(0, Math.floor((activeAttempt.deadline.getTime() - Date.now()) / 1000))
          }
        });
        return;
      }
    }

    // Check attempts limit
    const completedAttemptsCount = await TestAttempt.countDocuments({
      student: studentId,
      test: test._id,
      status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'] }
    });

    if (test.attemptsAllowed > 0 && completedAttemptsCount >= test.attemptsAllowed) {
      next(
        new AppError(
          `You have reached the maximum allowed attempts (${test.attemptsAllowed}) for this test.`,
          403
        )
      );
      return;
    }

    if (!test.questions || test.questions.length === 0) {
      next(new AppError('This test contains no questions yet.', 400));
      return;
    }

    // Build question snapshot
    let questionsList = [...(test.questions as any[])];
    if (test.randomizeQuestions) {
      questionsList = shuffleArray(questionsList);
    }

    const questionsSnapshot: IQuestionSnapshot[] = questionsList.map((q, idx) => ({
      questionId: q._id,
      section: q.section || 'General',
      order: idx + 1,
      type: q.type,
      questionText: q.questionText,
      options: q.options || [],
      marks: q.marks || 1,
      negativeMarks: test.negativeMarking ? (q.negativeMarks || test.negativeMarkValue || 0) : 0
    }));

    const durationMinutes = test.duration;
    const deadline = new Date(Date.now() + durationMinutes * 60 * 1000);

    const newAttempt = await TestAttempt.create({
      student: studentId,
      test: test._id,
      questionsSnapshot,
      answers: questionsSnapshot.map((q) => ({
        question: q.questionId,
        selectedOption: null,
        subjectiveAnswer: '',
        isMarkedForReview: false,
        marksAwarded: 0
      })),
      startedAt: new Date(),
      deadline,
      status: 'IN_PROGRESS',
      maxScore: test.totalMarks,
      score: 0,
      percentage: 0,
      isPassed: false,
      correct: 0,
      incorrect: 0,
      unanswered: questionsSnapshot.length,
      timeSpent: 0
    });

    res.status(201).json({
      success: true,
      message: 'Test attempt started.',
      data: {
        attemptId: newAttempt._id,
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          instructions: test.instructions,
          duration: test.duration,
          totalMarks: test.totalMarks,
          passingMarks: test.passingMarks,
          sections: test.sections,
          negativeMarking: test.negativeMarking,
          negativeMarkValue: test.negativeMarkValue
        },
        questions: questionsSnapshot,
        answers: newAttempt.answers,
        startedAt: newAttempt.startedAt,
        deadline: newAttempt.deadline,
        timeRemainingSeconds: durationMinutes * 60
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Save Draft Answers (Auto-Save during examination)
export const saveDraftAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { answers, timeSpent } = req.body;
    const studentId = req.user?.id;

    const attempt = await TestAttempt.findOne({
      _id: attemptId,
      student: studentId
    });

    if (!attempt) {
      next(new AppError('Attempt record not found.', 404));
      return;
    }

    if (attempt.status !== 'IN_PROGRESS') {
      next(new AppError('This attempt is already submitted and cannot be modified.', 400));
      return;
    }

    // Check deadline
    const gracePeriodMs = 30 * 1000;
    if (new Date() > new Date(attempt.deadline.getTime() + gracePeriodMs)) {
      // Auto-submit on timeout
      await autoSubmitAttemptInternal(attemptId);
      res.status(200).json({
        success: false,
        isExpired: true,
        message: 'Time has expired. Test has been automatically submitted.'
      });
      return;
    }

    if (Array.isArray(answers)) {
      attempt.answers = answers.map((ans: any) => ({
        question: new mongoose.Types.ObjectId(ans.question),
        selectedOption: ans.selectedOption !== undefined ? ans.selectedOption : null,
        subjectiveAnswer: ans.subjectiveAnswer || '',
        isMarkedForReview: Boolean(ans.isMarkedForReview),
        marksAwarded: 0
      }));
    }

    if (timeSpent !== undefined) {
      attempt.timeSpent = Number(timeSpent);
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Draft progress saved.',
      data: {
        savedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Internal auto-submit evaluation
const autoSubmitAttemptInternal = async (attemptId: string) => {
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt || attempt.status !== 'IN_PROGRESS') return;

  const test = await Test.findById(attempt.test);
  if (!test) return;

  const questionIds = attempt.questionsSnapshot.map((q) => q.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const questionMap = new Map<string, any>();
  questions.forEach((q) => questionMap.set(q._id.toString(), q));

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const evaluatedAnswers = attempt.answers.map((ans) => {
    const qDoc = questionMap.get(ans.question.toString());
    if (!qDoc) return ans;

    const snap = attempt.questionsSnapshot.find((s) => s.questionId.toString() === ans.question.toString());
    const marks = snap ? snap.marks : qDoc.marks || 1;
    const negativeMarks = snap ? snap.negativeMarks : (test.negativeMarking ? (qDoc.negativeMarks || test.negativeMarkValue || 0) : 0);

    let isCorrect: boolean | null = null;
    let marksAwarded = 0;

    if (qDoc.type === 'MCQ' || qDoc.type === 'TRUE_FALSE') {
      if (!ans.selectedOption || ans.selectedOption === '') {
        unansweredCount++;
        isCorrect = false;
        marksAwarded = 0;
      } else if (String(ans.selectedOption) === String(qDoc.correctAnswer)) {
        correctCount++;
        isCorrect = true;
        marksAwarded = marks;
      } else {
        incorrectCount++;
        isCorrect = false;
        marksAwarded = test.negativeMarking ? -negativeMarks : 0;
      }
    } else if (qDoc.type === 'MULTIPLE_CORRECT') {
      const selected = Array.isArray(ans.selectedOption) ? ans.selectedOption : [];
      const correct = Array.isArray(qDoc.correctAnswer) ? qDoc.correctAnswer : [qDoc.correctAnswer];

      if (selected.length === 0) {
        unansweredCount++;
        isCorrect = false;
        marksAwarded = 0;
      } else {
        const sortedSelected = [...selected].sort().join(',');
        const sortedCorrect = [...correct].sort().join(',');
        if (sortedSelected === sortedCorrect) {
          correctCount++;
          isCorrect = true;
          marksAwarded = marks;
        } else {
          incorrectCount++;
          isCorrect = false;
          marksAwarded = test.negativeMarking ? -negativeMarks : 0;
        }
      }
    } else if (qDoc.type === 'SUBJECTIVE') {
      if (!ans.subjectiveAnswer || ans.subjectiveAnswer.trim() === '') {
        unansweredCount++;
        isCorrect = false;
        marksAwarded = 0;
      } else {
        isCorrect = null; // Pending manual evaluation
        marksAwarded = 0;
      }
    }

    totalScore += marksAwarded;

    return {
      ...ans,
      isCorrect,
      marksAwarded
    };
  });

  const finalScore = Math.max(0, totalScore);
  const maxScore = test.totalMarks || attempt.questionsSnapshot.reduce((sum, q) => sum + q.marks, 0);
  const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
  const isPassed = finalScore >= test.passingMarks;

  attempt.answers = evaluatedAnswers as any;
  attempt.status = 'AUTO_SUBMITTED';
  attempt.submittedAt = new Date();
  attempt.score = finalScore;
  attempt.maxScore = maxScore;
  attempt.percentage = percentage;
  attempt.isPassed = isPassed;
  attempt.correct = correctCount;
  attempt.incorrect = incorrectCount;
  attempt.unanswered = unansweredCount;

  await attempt.save();
};

// 3. Submit Attempt (Student Final Submission)
export const submitAttempt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { answers, timeSpent } = req.body;
    const studentId = req.user?.id;

    const attempt = await TestAttempt.findOne({
      _id: attemptId,
      student: studentId
    });

    if (!attempt) {
      next(new AppError('Attempt record not found.', 404));
      return;
    }

    if (attempt.status !== 'IN_PROGRESS') {
      next(new AppError('This attempt has already been submitted.', 400));
      return;
    }

    const test = await Test.findById(attempt.test);
    if (!test) {
      next(new AppError('Test configuration not found.', 404));
      return;
    }

    // Determine if submission was on-time or timed-out
    const gracePeriodMs = 30 * 1000;
    const isLate = new Date() > new Date(attempt.deadline.getTime() + gracePeriodMs);
    const finalStatus = isLate ? 'AUTO_SUBMITTED' : 'SUBMITTED';

    // Populate answers from request if sent
    if (Array.isArray(answers)) {
      attempt.answers = answers.map((ans: any) => ({
        question: new mongoose.Types.ObjectId(ans.question),
        selectedOption: ans.selectedOption !== undefined ? ans.selectedOption : null,
        subjectiveAnswer: ans.subjectiveAnswer || '',
        isMarkedForReview: Boolean(ans.isMarkedForReview),
        marksAwarded: 0
      }));
    }

    const questionIds = attempt.questionsSnapshot.map((q) => q.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map<string, any>();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let hasSubjective = false;

    const evaluatedAnswers = attempt.answers.map((ans) => {
      const qDoc = questionMap.get(ans.question.toString());
      if (!qDoc) return ans;

      const snap = attempt.questionsSnapshot.find((s) => s.questionId.toString() === ans.question.toString());
      const marks = snap ? snap.marks : qDoc.marks || 1;
      const negativeMarks = snap ? snap.negativeMarks : (test.negativeMarking ? (qDoc.negativeMarks || test.negativeMarkValue || 0) : 0);

      let isCorrect: boolean | null = null;
      let marksAwarded = 0;

      if (qDoc.type === 'MCQ' || qDoc.type === 'TRUE_FALSE') {
        if (!ans.selectedOption || ans.selectedOption === '') {
          unansweredCount++;
          isCorrect = false;
          marksAwarded = 0;
        } else if (String(ans.selectedOption) === String(qDoc.correctAnswer)) {
          correctCount++;
          isCorrect = true;
          marksAwarded = marks;
        } else {
          incorrectCount++;
          isCorrect = false;
          marksAwarded = test.negativeMarking ? -negativeMarks : 0;
        }
      } else if (qDoc.type === 'MULTIPLE_CORRECT') {
        const selected = Array.isArray(ans.selectedOption) ? ans.selectedOption : [];
        const correct = Array.isArray(qDoc.correctAnswer) ? qDoc.correctAnswer : [qDoc.correctAnswer];

        if (selected.length === 0) {
          unansweredCount++;
          isCorrect = false;
          marksAwarded = 0;
        } else {
          const sortedSelected = [...selected].sort().join(',');
          const sortedCorrect = [...correct].sort().join(',');
          if (sortedSelected === sortedCorrect) {
            correctCount++;
            isCorrect = true;
            marksAwarded = marks;
          } else {
            incorrectCount++;
            isCorrect = false;
            marksAwarded = test.negativeMarking ? -negativeMarks : 0;
          }
        }
      } else if (qDoc.type === 'SUBJECTIVE') {
        hasSubjective = true;
        if (!ans.subjectiveAnswer || ans.subjectiveAnswer.trim() === '') {
          unansweredCount++;
          isCorrect = false;
          marksAwarded = 0;
        } else {
          isCorrect = null; // Pending teacher evaluation
          marksAwarded = 0;
        }
      }

      totalScore += marksAwarded;

      return {
        question: ans.question,
        selectedOption: ans.selectedOption,
        subjectiveAnswer: ans.subjectiveAnswer,
        isMarkedForReview: ans.isMarkedForReview,
        isCorrect,
        marksAwarded,
        feedback: ''
      };
    });

    const finalScore = Math.max(0, totalScore);
    const maxScore = test.totalMarks || attempt.questionsSnapshot.reduce((sum, q) => sum + q.marks, 0);
    const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
    const isPassed = finalScore >= test.passingMarks;

    attempt.answers = evaluatedAnswers as any;
    attempt.status = finalStatus;
    attempt.submittedAt = new Date();
    attempt.score = finalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = percentage;
    attempt.isPassed = isPassed;
    attempt.correct = correctCount;
    attempt.incorrect = incorrectCount;
    attempt.unanswered = unansweredCount;
    if (timeSpent !== undefined) {
      attempt.timeSpent = Number(timeSpent);
    } else {
      attempt.timeSpent = Math.min(
        test.duration * 60,
        Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000)
      );
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Test submitted successfully.',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        correct: attempt.correct,
        incorrect: attempt.incorrect,
        unanswered: attempt.unanswered,
        timeSpent: attempt.timeSpent,
        hasSubjectivePending: hasSubjective,
        showResults: test.showResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Attempt Result & Solution Review
export const getAttemptResult = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const attempt = await TestAttempt.findById(attemptId)
      .populate('student', 'name email avatar')
      .populate('test', 'title description totalMarks passingMarks showResults negativeMarking negativeMarkValue');

    if (!attempt) {
      next(new AppError('Attempt record not found.', 404));
      return;
    }

    // Authorization: only student owner or Admin/Mentor
    if (userRole === 'STUDENT' && attempt.student._id.toString() !== userId) {
      next(new AppError('You are not authorized to view this result.', 403));
      return;
    }

    const test: any = attempt.test;
    const isStudent = userRole === 'STUDENT';

    // If student and results visibility is disabled by instructor
    if (isStudent && !test.showResults) {
      res.status(200).json({
        success: true,
        message: 'Your test was submitted. Detailed results are withheld by the instructor.',
        data: {
          attempt: {
            _id: attempt._id,
            test: {
              _id: test._id,
              title: test.title
            },
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            timeSpent: attempt.timeSpent,
            showResults: false
          }
        }
      });
      return;
    }

    // Build question-by-question review with solutions and explanations
    const questionIds = attempt.questionsSnapshot.map((q) => q.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map<string, any>();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    const detailedReview = attempt.questionsSnapshot.map((snap) => {
      const qDoc = questionMap.get(snap.questionId.toString());
      const studentAns = attempt.answers.find((a) => a.question.toString() === snap.questionId.toString());

      return {
        questionId: snap.questionId,
        section: snap.section,
        order: snap.order,
        type: snap.type,
        questionText: snap.questionText,
        options: snap.options,
        marks: snap.marks,
        negativeMarks: snap.negativeMarks,
        correctAnswer: qDoc ? qDoc.correctAnswer : null,
        explanation: qDoc ? qDoc.explanation : '',
        difficulty: qDoc ? qDoc.difficulty : 'MEDIUM',
        studentSelectedOption: studentAns ? studentAns.selectedOption : null,
        studentSubjectiveAnswer: studentAns ? studentAns.subjectiveAnswer : '',
        isCorrect: studentAns ? studentAns.isCorrect : false,
        marksAwarded: studentAns ? studentAns.marksAwarded : 0,
        feedback: studentAns ? studentAns.feedback : ''
      };
    });

    res.status(200).json({
      success: true,
      message: 'Attempt result retrieved successfully.',
      data: {
        attempt: {
          _id: attempt._id,
          student: attempt.student,
          test: {
            _id: test._id,
            title: test.title,
            totalMarks: test.totalMarks,
            passingMarks: test.passingMarks
          },
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent,
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: attempt.percentage,
          isPassed: attempt.isPassed,
          correct: attempt.correct,
          incorrect: attempt.incorrect,
          unanswered: attempt.unanswered,
          showResults: true,
          questionsReview: detailedReview
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Student's Past Attempts for a Test
export const getMyAttempts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;

    const attempts = await TestAttempt.find({
      student: studentId,
      test: id
    })
      .sort({ createdAt: -1 })
      .select('score maxScore percentage isPassed correct incorrect unanswered timeSpent status startedAt submittedAt');

    res.status(200).json({
      success: true,
      message: 'Student attempts retrieved.',
      data: { attempts }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get All Attempts for a Test (Admin / Mentor)
export const getAllAttemptsForTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const attempts = await TestAttempt.find({ test: id })
      .populate('student', 'name email avatar role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All test submissions retrieved.',
      data: { attempts }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Manual Grading for Subjective Questions (Admin / Mentor)
export const gradeSubjectiveAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { questionId, marksAwarded, feedback } = req.body;

    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt) {
      next(new AppError('Attempt record not found.', 404));
      return;
    }

    const test = await Test.findById(attempt.test);
    if (!test) {
      next(new AppError('Test record not found.', 404));
      return;
    }

    const answerIndex = attempt.answers.findIndex((a) => a.question.toString() === questionId);
    if (answerIndex === -1) {
      next(new AppError('Question answer record not found in this attempt.', 404));
      return;
    }

    const awarded = Number(marksAwarded) || 0;
    attempt.answers[answerIndex].marksAwarded = awarded;
    attempt.answers[answerIndex].isCorrect = awarded > 0;
    if (feedback !== undefined) {
      attempt.answers[answerIndex].feedback = feedback;
    }

    // Recalculate attempt score
    const totalScore = attempt.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    const finalScore = Math.max(0, totalScore);
    const maxScore = attempt.maxScore || test.totalMarks || 100;
    const percentage = Math.round((finalScore / maxScore) * 100);

    attempt.score = finalScore;
    attempt.percentage = percentage;
    attempt.isPassed = finalScore >= test.passingMarks;
    attempt.status = 'EVALUATED';

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Subjective answer graded successfully.',
      data: { attempt }
    });
  } catch (error) {
    next(error);
  }
};
