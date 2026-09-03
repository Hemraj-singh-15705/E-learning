import mongoose, { Schema } from 'mongoose';
import { ICoupon } from '../types/coupon';

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      default: 'PERCENTAGE',
      required: true
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value must be at least 1']
    },
    maxDiscount: {
      type: Number,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    usageLimit: {
      type: Number,
      default: 100
    },
    usedCount: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    active: {
      type: Boolean,
      default: true
    },
    applicablePlans: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Plan'
      }
    ],
    usedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

CouponSchema.index({ code: 1, active: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
