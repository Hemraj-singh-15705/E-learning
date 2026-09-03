import { Request, Response, NextFunction } from 'express';
import Question from '../models/Question';
import Test from '../models/Test';
import { AppError } from '../utils/errors';

// 1. Get Questions in the Question Bank (Search, Filters, Tags, Difficulty, Course, Type)
export const getBankQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      difficulty,
      type,
      tag,
      course,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    const queryConditions: any = { isBankQuestion: true };

    if (difficulty) queryConditions.difficulty = difficulty;
    if (type) queryConditions.type = type;
    if (course) queryConditions.course = course;
    if (tag) queryConditions.tags = tag;

    if (search) {
      queryConditions.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { explanation: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const sortOption: any = {};
    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const questions = await Question.find(queryConditions)
      .populate('course', 'title slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const total = await Question.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      message: 'Question bank retrieved successfully.',
      data: {
        items: questions,
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

// 2. Create Question in Question Bank
export const createBankQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      questionText,
      type,
      options,
      correctAnswer,
      marks = 1,
      negativeMarks = 0,
      explanation,
      difficulty = 'MEDIUM',
      tags = [],
      course,
      section = 'General'
    } = req.body;

    if (!questionText) {
      next(new AppError('Question text is required.', 400));
      return;
    }

    if (!['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT', 'SUBJECTIVE'].includes(type)) {
      next(new AppError('Invalid question type.', 400));
      return;
    }

    if (['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT'].includes(type) && (!options || options.length < 2)) {
      next(new AppError('Objective questions require at least two answer options.', 400));
      return;
    }

    const question = await Question.create({
      questionText,
      type,
      options,
      correctAnswer,
      marks: Number(marks) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      explanation,
      difficulty,
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      course: course || null,
      section,
      isBankQuestion: true,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Question added to bank successfully.',
      data: { question }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update Question in Question Bank
export const updateBankQuestion = async (
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
      marks,
      negativeMarks,
      explanation,
      difficulty,
      tags,
      course,
      section
    } = req.body;

    const question = await Question.findById(id);
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
    if (course !== undefined) question.course = course || null;
    if (section !== undefined) question.section = section;

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      data: { question }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Question from Bank
export const deleteBankQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      next(new AppError('Question not found.', 404));
      return;
    }

    // Check if question is referenced in tests
    const attachedTestsCount = await Test.countDocuments({ questions: id });
    if (attachedTestsCount > 0) {
      // Just remove bank flag rather than deleting so attached tests stay intact
      question.isBankQuestion = false;
      await question.save();
    } else {
      await question.deleteOne();
    }

    res.status(200).json({
      success: true,
      message: 'Question removed from question bank successfully.',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// 5. Import Selected Bank Questions into a Test
export const importBankQuestionsToTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { testId, questionIds, section = 'General' } = req.body;

    if (!testId || !Array.isArray(questionIds) || questionIds.length === 0) {
      next(new AppError('testId and an array of questionIds are required.', 400));
      return;
    }

    const test = await Test.findById(testId);
    if (!test) {
      next(new AppError('Target test not found.', 404));
      return;
    }

    const bankQuestions = await Question.find({ _id: { $in: questionIds } });
    if (bankQuestions.length === 0) {
      next(new AppError('No matching bank questions found.', 404));
      return;
    }

    // Clone questions specifically for this test so edits to the test don't alter the global bank
    const newQuestions = [];
    const currentQuestionCount = test.questions.length;

    for (let i = 0; i < bankQuestions.length; i++) {
      const bq = bankQuestions[i];
      const cloned = await Question.create({
        test: test._id,
        isBankQuestion: false,
        course: test.course || bq.course,
        section: section || bq.section || 'General',
        questionText: bq.questionText,
        type: bq.type,
        options: bq.options,
        correctAnswer: bq.correctAnswer,
        marks: bq.marks,
        negativeMarks: bq.negativeMarks,
        explanation: bq.explanation,
        difficulty: bq.difficulty,
        tags: bq.tags,
        order: currentQuestionCount + i + 1,
        createdBy: req.user?.id
      });
      newQuestions.push(cloned);
      test.questions.push(cloned._id);
    }

    // Recalculate test total marks
    const allQuestions = await Question.find({ _id: { $in: test.questions } });
    const totalMarks = allQuestions.reduce((acc, q) => acc + (q.marks || 0), 0);
    test.totalMarks = totalMarks;

    await test.save();

    res.status(200).json({
      success: true,
      message: `${newQuestions.length} questions imported to test successfully.`,
      data: {
        importedCount: newQuestions.length,
        test
      }
    });
  } catch (error) {
    next(error);
  }
};
