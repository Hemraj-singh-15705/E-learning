import { Document, Types } from 'mongoose';

export type BillingInterval = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME' | 'ONE_TIME';

export interface IPlanLimits {
  maxCourses?: number;
  mentorSessionsPerMonth?: number;
  testAttemptsLimit?: number;
  certificateIncluded?: boolean;
}

export interface IPlan extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  duration: number; // in days
  features: string[];
  active: boolean;
  limits: IPlanLimits;
  applicableCourses?: Types.ObjectId[];
  applicableBatches?: Types.ObjectId[];
  isPopular?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
