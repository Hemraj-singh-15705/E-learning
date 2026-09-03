import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '../types/test';

const optionSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    test: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      default: null
    },
    isBankQuestion: {
      type: Boolean,
      default: false
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    section: {
      type: String,
      trim: true,
      default: 'General'
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT', 'SUBJECTIVE'],
      default: 'MCQ',
      required: true
    },
    options: {
      type: [optionSchema],
      default: []
    },
    correctAnswer: {
      type: Schema.Types.Mixed,
      required: [true, 'Correct answer specification is required']
    },
    marks: {
      type: Number,
      default: 1,
      min: [0, 'Marks cannot be negative']
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: [0, 'Negative marks cannot be less than 0']
    },
    explanation: {
      type: String,
      trim: true,
      default: ''
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM'
    },
    tags: {
      type: [String],
      default: []
    },
    order: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

questionSchema.index({ test: 1, order: 1 });
questionSchema.index({ isBankQuestion: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ course: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
export default Question;
