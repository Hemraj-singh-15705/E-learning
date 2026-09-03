import mongoose, { Schema } from 'mongoose';
import { IPlan } from '../types/plan';

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true
    },
    billingInterval: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME', 'ONE_TIME'],
      default: 'MONTHLY'
    },
    duration: {
      type: Number, // in days
      default: 30
    },
    features: {
      type: [String],
      default: []
    },
    active: {
      type: Boolean,
      default: true
    },
    limits: {
      maxCourses: { type: Number, default: 10 },
      mentorSessionsPerMonth: { type: Number, default: 2 },
      testAttemptsLimit: { type: Number, default: 5 },
      certificateIncluded: { type: Boolean, default: true }
    },
    applicableCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    applicableBatches: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Batch'
      }
    ],
    isPopular: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

PlanSchema.index({ active: 1, price: 1 });

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
