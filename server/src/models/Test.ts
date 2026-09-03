import mongoose, { Schema } from 'mongoose';
import { ITest } from '../types/test';

const sectionSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const testSchema = new Schema<ITest>(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      default: null
    },
    duration: {
      type: Number,
      required: [true, 'Test duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute']
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: [0, 'Total marks cannot be negative']
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
      min: [0, 'Passing marks cannot be negative']
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    negativeMarkValue: {
      type: Number,
      default: 0,
      min: [0, 'Negative mark value cannot be negative']
    },
    attemptsAllowed: {
      type: Number,
      default: 1, // 0 = unlimited
      min: [0, 'Attempts allowed cannot be negative']
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true // if true, students see their score and solution explanations right after submission
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    sections: {
      type: [sectionSchema],
      default: [
        {
          id: 'default',
          title: 'General Section',
          description: 'Main questions',
          order: 0
        }
      ]
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
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

testSchema.index({ slug: 1 });
testSchema.index({ status: 1 });
testSchema.index({ course: 1 });
testSchema.index({ batch: 1 });

export const Test = mongoose.model<ITest>('Test', testSchema);
export default Test;
