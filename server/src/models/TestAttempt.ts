import mongoose, { Schema } from 'mongoose';
import { ITestAttempt } from '../types/test';

const questionSnapshotSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    section: {
      type: String,
      default: 'General'
    },
    order: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT', 'SUBJECTIVE'],
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true }
      }
    ],
    marks: {
      type: Number,
      default: 1
    },
    negativeMarks: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const attemptAnswerSchema = new Schema(
  {
    question: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: Schema.Types.Mixed,
      default: null
    },
    subjectiveAnswer: {
      type: String,
      default: ''
    },
    isMarkedForReview: {
      type: Boolean,
      default: false
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    marksAwarded: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const testAttemptSchema = new Schema<ITestAttempt>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    test: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true
    },
    questionsSnapshot: {
      type: [questionSnapshotSchema],
      default: []
    },
    answers: {
      type: [attemptAnswerSchema],
      default: []
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    submittedAt: {
      type: Date,
      default: null
    },
    deadline: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'ABANDONED', 'EVALUATED'],
      default: 'IN_PROGRESS'
    },
    score: {
      type: Number,
      default: 0
    },
    maxScore: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    isPassed: {
      type: Boolean,
      default: false
    },
    correct: {
      type: Number,
      default: 0
    },
    incorrect: {
      type: Number,
      default: 0
    },
    unanswered: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0 // in seconds
    }
  },
  {
    timestamps: true
  }
);

testAttemptSchema.index({ student: 1, test: 1, status: 1 });
testAttemptSchema.index({ test: 1, status: 1 });

export const TestAttempt = mongoose.model<ITestAttempt>('TestAttempt', testAttemptSchema);
export default TestAttempt;
