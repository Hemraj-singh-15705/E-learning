import mongoose, { Schema } from 'mongoose';
import { IAssignment } from '../types/assignment';

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    module: {
      type: Schema.Types.ObjectId
    },
    lesson: {
      type: Schema.Types.ObjectId
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch'
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [1, 'Total marks must be at least 1'],
      default: 100
    },
    allowedFileTypes: {
      type: [String],
      default: ['pdf', 'zip', 'docx', 'png', 'jpg', 'js', 'ts', 'py']
    },
    maxFileSize: {
      type: Number, // in MB
      default: 25
    },
    maxFiles: {
      type: Number,
      default: 5
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy user is required']
    }
  },
  {
    timestamps: true
  }
);

AssignmentSchema.index({ batch: 1, status: 1 });
AssignmentSchema.index({ course: 1, status: 1 });
AssignmentSchema.index({ mentor: 1, status: 1 });
AssignmentSchema.index({ dueDate: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
