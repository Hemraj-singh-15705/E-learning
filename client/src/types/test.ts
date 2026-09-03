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

export interface IQuestion {
  _id: string;
  test?: string;
  isBankQuestion?: boolean;
  course?: {
    _id: string;
    title: string;
    slug: string;
  } | string;
  section?: string;
  questionText: string;
  type: QuestionType;
  options: IQuestionOption[];
  correctAnswer?: string | string[];
  marks: number;
  negativeMarks: number;
  explanation?: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITest {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  course?: {
    _id: string;
    title: string;
    slug?: string;
  };
  batch?: {
    _id: string;
    name: string;
    code?: string;
  };
  duration: number; // minutes
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  attemptsAllowed: number; // 0 = unlimited
  randomizeQuestions: boolean;
  showResults: boolean;
  status: TestStatus;
  startTime?: string;
  endTime?: string;
  sections: ISection[];
  questions?: IQuestion[];
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
  // Annotations for student views:
  attemptsUsed?: number;
  attemptsRemaining?: number | string;
  hasActiveAttempt?: boolean;
  activeAttemptId?: string;
  bestScore?: number | null;
  isPassed?: boolean;
  questionsCount?: number;
  attemptsHistory?: Array<{
    _id: string;
    score: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    submittedAt: string;
    status: AttemptStatus;
  }>;
}

export interface IQuestionSnapshot {
  questionId: string;
  section?: string;
  order: number;
  type: QuestionType;
  questionText: string;
  options: IQuestionOption[];
  marks: number;
  negativeMarks: number;
}

export interface IAttemptAnswer {
  question: string;
  selectedOption?: string | string[] | null;
  subjectiveAnswer?: string;
  isMarkedForReview?: boolean;
  isCorrect?: boolean | null;
  marksAwarded?: number;
  feedback?: string;
}

export interface ITestAttempt {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  test: {
    _id: string;
    title: string;
    totalMarks: number;
    passingMarks: number;
    duration?: number;
    negativeMarking?: boolean;
    negativeMarkValue?: number;
    showResults?: boolean;
  };
  questionsSnapshot: IQuestionSnapshot[];
  answers: IAttemptAnswer[];
  startedAt: string;
  submittedAt?: string;
  deadline: string;
  status: AttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  correct: number;
  incorrect: number;
  unanswered: number;
  timeSpent: number; // in seconds
  showResults?: boolean;
  questionsReview?: Array<{
    questionId: string;
    section?: string;
    order: number;
    type: QuestionType;
    questionText: string;
    options: IQuestionOption[];
    marks: number;
    negativeMarks: number;
    correctAnswer?: string | string[];
    explanation?: string;
    difficulty: QuestionDifficulty;
    studentSelectedOption?: string | string[] | null;
    studentSubjectiveAnswer?: string;
    isCorrect: boolean | null;
    marksAwarded: number;
    feedback?: string;
  }>;
}

export interface ITestAnalytics {
  testTitle: string;
  totalMarks: number;
  passingMarks: number;
  totalAttempts: number;
  passRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageTimeSpent: number;
  questionAccuracy: Array<{
    questionId: string;
    questionText: string;
    type: QuestionType;
    difficulty: QuestionDifficulty;
    marks: number;
    totalResponses: number;
    correctAnswers: number;
    accuracyPercentage: number;
  }>;
  recentSubmissions: Array<{
    _id: string;
    student: {
      _id: string;
      name: string;
      email: string;
    };
    score: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    timeSpent: number;
    submittedAt: string;
    status: AttemptStatus;
  }>;
}
