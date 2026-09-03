import { Document, Types } from 'mongoose';

export type CouponType = 'PERCENTAGE' | 'FIXED';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  type: CouponType;
  value: number; // percentage (e.g. 20) or fixed amount (e.g. 500)
  maxDiscount?: number; // max cap for percentage discounts
  minOrderAmount?: number;
  usageLimit?: number; // total allowed uses
  usedCount: number;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  applicablePlans?: Types.ObjectId[];
  usedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
