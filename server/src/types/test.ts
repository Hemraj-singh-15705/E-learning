import { Document, Types } from 'mongoose';

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'MULTIPLE_CORRECT' | 'SUBJECTIVE';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'ABANDONED' | 'EVALUATED';

export interface IQuestionOption {
  id: string;
  text: string;
}

export interface ISection {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  test?: Types.ObjectId;
  isBankQuestion: boolean;
  course?: Types.ObjectId;
  section?: string;
  questionText: string;
  type: QuestionType;
  options: IQuestionOption[];
  correctAnswer: string | string[]; // Single ID for MCQ/TF, array of IDs for MULTIPLE_CORRECT, text/rubric for SUBJECTIVE
  marks: number;
  negativeMarks: number;
  explanation?: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  order: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITest extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  course?: Types.ObjectId;
  batch?: Types.ObjectId;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  attemptsAllowed: number; // 0 = unlimited
  randomizeQuestions: boolean;
  showResults: boolean; // whether students see detailed solutions immediately after submitting
  status: TestStatus;
  startTime?: Date;
  endTime?: Date;
  sections: ISection[];
  questions: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionSnapshot {
  questionId: Types.ObjectId;
  section?: string;
  order: number;
  type: QuestionType;
  questionText: string;
  options: IQuestionOption[];
  marks: number;
  negativeMarks: number;
}

export interface IAttemptAnswer {
  question: Types.ObjectId;
  selectedOption?: string | string[]; // option id or array of option ids
  subjectiveAnswer?: string;
  isMarkedForReview?: boolean;
  isCorrect?: boolean;
  marksAwarded?: number;
  feedback?: string;
}

export interface ITestAttempt extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  test: Types.ObjectId;
  questionsSnapshot: IQuestionSnapshot[];
  answers: IAttemptAnswer[];
  startedAt: Date;
  submittedAt?: Date;
  deadline: Date;
  status: AttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  correct: number;
  incorrect: number;
  unanswered: number;
  timeSpent: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}
