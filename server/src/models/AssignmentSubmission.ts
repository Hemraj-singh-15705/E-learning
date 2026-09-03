import mongoose, { Schema } from 'mongoose';
import { IAssignmentSubmission } from '../types/assignment';

const SubmissionFileSchema = new Schema(
  {
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true }
  },
  { _id: true }
);

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required']
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    files: [SubmissionFileSchema],
    answer: {
      type: String,
      trim: true
    },
    githubUrl: {
      type: String,
      trim: true
    },
    liveUrl: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'LATE', 'REVIEWED', 'RETURNED'],
      default: 'SUBMITTED'
    },
    marks: {
      type: Number,
      min: 0
    },
    feedback: {
      type: String,
      trim: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one submission record per student per assignment
AssignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ student: 1, status: 1 });
AssignmentSubmissionSchema.index({ assignment: 1, status: 1 });

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>(
  'AssignmentSubmission',
  AssignmentSubmissionSchema
);

export default AssignmentSubmission;
