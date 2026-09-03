import mongoose, { Schema } from 'mongoose';
import { IBatch } from '../types/batch';

const batchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      maxlength: [100, 'Batch name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Batch code is required'],
      unique: true,
      trim: true
    },
    description: String,
    thumbnail: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    startDate: Date,
    endDate: Date,
    capacity: {
      type: Number,
      required: [true, 'Batch capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    mentors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    settings: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
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

batchSchema.index({ status: 1 });

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
export default Batch;
