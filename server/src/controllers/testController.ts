import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Test from '../models/Test';
import Question from '../models/Question';
import TestAttempt from '../models/TestAttempt';
import Enrollment from '../models/Enrollment';
import Batch from '../models/Batch';
import { AppError } from '../utils/errors';

const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// 1. Get Tests (Filtered by role, search, status, course, batch)
export const getTests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      course,
      batch,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    const queryConditions: any = {};
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (userRole === 'STUDENT') {
      queryConditions.status = 'PUBLISHED';

      // Find batches where student is actively enrolled
      const enrollments = await Enrollment.find({
        student: userId,
        status: 'ACTIVE'
      }).select('batch');

      const enrolledBatchIds = enrollments.map((e) => e.batch);

      // Find courses linked to these batches
      const enrolledBatches = await Batch.find({
        _id: { $in: enrolledBatchIds }
      }).select('courses');

      const enrolledCourseIds = enrolledBatches.flatMap((b) => b.courses || []);

      // Student can see tests attached to their enrolled batches, courses, or general tests with neither
      queryConditions.$or = [
        { batch: { $in: enrolledBatchIds } },
        { course: { $in: enrolledCourseIds } },
        { batch: null, course: null }
      ];
    } else {
      // Admin or Mentor filters
      if (status) queryConditions.status = status;
      if (course) queryConditions.course = course;
      if (batch) queryConditions.batch = batch;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      if (queryConditions.$or) {
        queryConditions.$and = [
          { $or: queryConditions.$or },
          { $or: [{ title: searchRegex }, { description: searchRegex }] }
        ];
        delete queryConditions.$or;
      } else {
        queryConditions.$or = [{ title: searchRegex }, { description: searchRegex }];
      }
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const sortOption: any = {};
    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const tests = await Test.find(queryConditions)
      .populate('course', 'title slug')
      .populate('batch', 'name code')
      .populate('createdBy', 'name email role')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const total = await Test.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limitNumber);

    // If Student, attach attempt statistics for each test
    let formattedTests: any[] = tests;
    if (userRole === 'STUDENT') {
      const testIds = tests.map((t) => t._id);
      const attempts = await TestAttempt.find({
        student: userId,
        test: { $in: testIds }
      }).sort({ createdAt: -1 });

      formattedTests = tests.map((test) => {
        const testObj = test.toObject();
        const testAttempts = attempts.filter((a) => a.test.toString() === test._id.toString());
        const completedAttempts = testAttempts.filter((a) => ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'].includes(a.status));
        const activeAttempt = testAttempts.find((a) => a.status === 'IN_PROGRESS');

        const bestScore = completedAttempts.length > 0 ? Math.max(...completedAttempts.map((a) => a.score)) : null;

        return {
          ...testObj,
          attemptsUsed: completedAttempts.length,
          hasActiveAttempt: !!activeAttempt,
          activeAttemptId: activeAttempt?._id || null,
          bestScore,
          isPassed: completedAttempts.some((a) => a.isPassed),
          questionsCount: test.questions?.length || 0
        };
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tests retrieved successfully.',
      data: {
        items: formattedTests,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create Test
export const createTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      instructions,
      course,
      batch,
      duration,
      passingMarks,
      negativeMarking = false,
      negativeMarkValue = 0,
      attemptsAllowed = 1,
      randomizeQuestions = false,
      showResults = true,
      status = 'DRAFT',
      startTime,
      endTime,
      sections = []
    } = req.body;

    if (!title || !duration || passingMarks === undefined) {
      next(new AppError('Title, duration, and passing marks are required.', 400));
      return;
    }

    let slug = generateSlug(title);
    const existing = await Test.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const test = await Test.create({
      title,
      slug,
      description,
      instructions,
      course: course || null,
      batch: batch || null,
      duration: Number(duration),
      totalMarks: 0,
      passingMarks: Number(passingMarks),
      negativeMarking: Boolean(negativeMarking),
      negativeMarkValue: Number(negativeMarkValue) || 0,
      attemptsAllowed: Number(attemptsAllowed) || 1,
      randomizeQuestions: Boolean(randomizeQuestions),
      showResults: Boolean(showResults),
      status: status || 'DRAFT',
      startTime: startTime || null,
      endTime: endTime || null,
      sections: sections.length > 0 ? sections : [{ id: 'default', title: 'General Section', order: 0 }],
      questions: [],
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Test created successfully.',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Test Details
export const getTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let testQuery = Test.findById(id)
      .populate('course', 'title slug')
      .populate('batch', 'name code')
      .populate('createdBy', 'name email');

    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MENTOR') {
      testQuery = testQuery.populate({
        path: 'questions',
        options: { sort: { order: 1 } }
      });
    }

    const test = await testQuery;
    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    let testData: any = test.toObject();

    // If Student, sanitize and attach attempt stats
    if (userRole === 'STUDENT') {
      delete testData.questions; // Student gets questions ONLY when launching an attempt

      const attempts = await TestAttempt.find({
        student: userId,
        test: test._id
      }).sort({ createdAt: -1 });

      const completedAttempts = attempts.filter((a) =>
        ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'].includes(a.status)
      );
      const activeAttempt = attempts.find((a) => a.status === 'IN_PROGRESS');

      testData.attemptsUsed = completedAttempts.length;
      testData.attemptsRemaining =
        test.attemptsAllowed === 0 ? 'Unlimited' : Math.max(0, test.attemptsAllowed - completedAttempts.length);
      testData.hasActiveAttempt = !!activeAttempt;
      testData.activeAttemptId = activeAttempt?._id || null;
      testData.questionsCount = test.questions?.length || 0;
      testData.attemptsHistory = completedAttempts.map((a) => ({
        _id: a._id,
        score: a.score,
        maxScore: a.maxScore,
        percentage: a.percentage,
        isPassed: a.isPassed,
        submittedAt: a.submittedAt,
        status: a.status
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Test details fetched successfully.',
      data: { test: testData }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Test
export const updateTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      instructions,
      course,
      batch,
      duration,
      passingMarks,
      negativeMarking,
      negativeMarkValue,
      attemptsAllowed,
      randomizeQuestions,
      showResults,
      status,
      startTime,
      endTime,
      sections
    } = req.body;

    const test = await Test.findById(id);
    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    if (title && title !== test.title) {
      let slug = generateSlug(title);
      const existing = await Test.findOne({ slug });
      if (existing && existing._id.toString() !== id) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
      test.slug = slug;
      test.title = title;
    }

    if (description !== undefined) test.description = description;
    if (instructions !== undefined) test.instructions = instructions;
    if (course !== undefined) test.course = course || null;
    if (batch !== undefined) test.batch = batch || null;
    if (duration !== undefined) test.duration = Number(duration);
    if (passingMarks !== undefined) test.passingMarks = Number(passingMarks);
    if (negativeMarking !== undefined) test.negativeMarking = Boolean(negativeMarking);
    if (negativeMarkValue !== undefined) test.negativeMarkValue = Number(negativeMarkValue);
    if (attemptsAllowed !== undefined) test.attemptsAllowed = Number(attemptsAllowed);
    if (randomizeQuestions !== undefined) test.randomizeQuestions = Boolean(randomizeQuestions);
    if (showResults !== undefined) test.showResults = Boolean(showResults);
    if (status !== undefined) test.status = status;
    if (startTime !== undefined) test.startTime = startTime || null;
    if (endTime !== undefined) test.endTime = endTime || null;
    if (sections !== undefined && Array.isArray(sections)) test.sections = sections;

    await test.save();

    res.status(200).json({
      success: true,
      message: 'Test updated successfully.',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Test Status
export const updateTestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      next(new AppError('Invalid status value.', 400));
      return;
    }

    const test = await Test.findByIdAndUpdate(id, { status }, { new: true });
    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    res.status(200).json({
      success: true,
      message: `Test status updated to ${status}.`,
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete Test
export const deleteTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);

    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    // Delete questions specific to this test
    await Question.deleteMany({ test: id, isBankQuestion: false });
    await test.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Test and associated questions deleted successfully.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// 7. Add Question to Test
export const addQuestionToTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      questionText,
      type,
      options,
      correctAnswer,
      marks = 1,
      negativeMarks = 0,
      explanation = '',
      difficulty = 'MEDIUM',
      tags = [],
      section = 'General',
      saveToBank = false
    } = req.body;

    const test = await Test.findById(id);
    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    if (!questionText) {
      next(new AppError('Question text is required.', 400));
      return;
    }

    const currentQuestionCount = test.questions.length;

    const question = await Question.create({
      test: test._id,
      isBankQuestion: Boolean(saveToBank),
      course: test.course,
      section: section || 'General',
      questionText,
      type,
      options,
      correctAnswer,
      marks: Number(marks) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      explanation,
      difficulty,
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      order: currentQuestionCount + 1,
      createdBy: req.user?.id
    });

    test.questions.push(question._id);

    // Update total marks
    const questions = await Question.find({ _id: { $in: test.questions } });
    test.totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
    await test.save();

    res.status(201).json({
      success: true,
      message: 'Question added to test successfully.',
      data: { question, test }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Update Question
export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { questionId } = req.params;
    const {
      questionText,
      type,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      explanation,
      difficulty,
      tags,
      section,
      order
    } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      next(new AppError('Question not found.', 404));
      return;
    }

    if (questionText !== undefined) question.questionText = questionText;
    if (type !== undefined) question.type = type;
    if (options !== undefined) question.options = options;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (marks !== undefined) question.marks = Number(marks);
    if (negativeMarks !== undefined) question.negativeMarks = Number(negativeMarks);
    if (explanation !== undefined) question.explanation = explanation;
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (tags !== undefined) question.tags = Array.isArray(tags) ? tags : [tags].filter(Boolean);
    if (section !== undefined) question.section = section;
    if (order !== undefined) question.order = Number(order);

    await question.save();

    // Recalculate test total marks if attached to test
    if (question.test) {
      const test = await Test.findById(question.test);
      if (test) {
        const questions = await Question.find({ _id: { $in: test.questions } });
        test.totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
        await test.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      data: { question }
    });
  } catch (error) {
    next(error);
  }
};

// 9. Delete Question from Test
export const deleteQuestionFromTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, questionId } = req.params;

    const test = await Test.findById(id);
    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    test.questions = test.questions.filter((qId) => qId.toString() !== questionId);

    const question = await Question.findById(questionId);
    if (question && !question.isBankQuestion) {
      await question.deleteOne();
    }

    // Recalculate test total marks
    const questions = await Question.find({ _id: { $in: test.questions } });
    test.totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
    await test.save();

    res.status(200).json({
      success: true,
      message: 'Question removed from test successfully.',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

// 10. Reorder Questions
export const reorderQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderedQuestionIds } = req.body;

    if (!Array.isArray(orderedQuestionIds)) {
      next(new AppError('orderedQuestionIds array is required.', 400));
      return;
    }

    const test = await Test.findById(id);
    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    test.questions = orderedQuestionIds.map((qid) => new mongoose.Types.ObjectId(qid));
    await test.save();

    // Update order field in Question documents
    const updates = orderedQuestionIds.map((qid, idx) =>
      Question.findByIdAndUpdate(qid, { order: idx + 1 })
    );
    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: 'Questions reordered successfully.',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

// 11. Test Analytics Foundation
export const getTestAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id).populate('questions');
    if (!test) {
      next(new AppError('Test not found.', 404));
      return;
    }

    const attempts = await TestAttempt.find({
      test: id,
      status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'] }
    }).populate('student', 'name email');

    const totalAttempts = attempts.length;
    if (totalAttempts === 0) {
      res.status(200).json({
        success: true,
        message: 'No completed attempts for this test yet.',
        data: {
          testTitle: test.title,
          totalAttempts: 0,
          passRate: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          averageTimeSpent: 0,
          questionAccuracy: [],
          attempts: []
        }
      });
      return;
    }

    const passedCount = attempts.filter((a) => a.isPassed).length;
    const passRate = Math.round((passedCount / totalAttempts) * 100);

    const scores = attempts.map((a) => a.score);
    const totalScoreSum = scores.reduce((sum, s) => sum + s, 0);
    const averageScore = Number((totalScoreSum / totalAttempts).toFixed(1));
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const times = attempts.map((a) => a.timeSpent || 0);
    const averageTimeSpent = Math.round(times.reduce((sum, t) => sum + t, 0) / totalAttempts);

    // Question Accuracy Breakdown
    const questionAccuracy = (test.questions as any[]).map((q) => {
      let correctAnswers = 0;
      let totalResponses = 0;

      attempts.forEach((att) => {
        const studentAns = att.answers.find((ans) => ans.question.toString() === q._id.toString());
        if (studentAns) {
          totalResponses++;
          if (studentAns.isCorrect) correctAnswers++;
        }
      });

      const accuracyPercentage = totalResponses > 0 ? Math.round((correctAnswers / totalResponses) * 100) : 0;

      return {
        questionId: q._id,
        questionText: q.questionText,
        type: q.type,
        difficulty: q.difficulty,
        marks: q.marks,
        totalResponses,
        correctAnswers,
        accuracyPercentage
      };
    });

    res.status(200).json({
      success: true,
      message: 'Test analytics retrieved successfully.',
      data: {
        testTitle: test.title,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        totalAttempts,
        passRate,
        averageScore,
        highestScore,
        lowestScore,
        averageTimeSpent,
        questionAccuracy,
        recentSubmissions: attempts.slice(0, 20).map((a) => ({
          _id: a._id,
          student: a.student,
          score: a.score,
          maxScore: a.maxScore,
          percentage: a.percentage,
          isPassed: a.isPassed,
          timeSpent: a.timeSpent,
          submittedAt: a.submittedAt,
          status: a.status
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
