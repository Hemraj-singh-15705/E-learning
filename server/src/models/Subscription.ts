import mongoose, { Schema } from 'mongoose';
import { ISubscription } from '../types/subscription';

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required']
    },
    startDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    canceledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

SubscriptionSchema.index({ user: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema
);

export default Subscription;
