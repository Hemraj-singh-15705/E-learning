import { Document, Types } from 'mongoose';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  plan: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  payment?: Types.ObjectId;
  autoRenew: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
