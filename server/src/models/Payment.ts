import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../types/payment';

const PaymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    provider: {
      type: String,
      enum: ['STRIPE', 'RAZORPAY', 'PAYPAL', 'SANDBOX'],
      default: 'SANDBOX'
    },
    providerPaymentId: {
      type: String,
      trim: true
    },
    providerOrderId: {
      type: String,
      trim: true
    },
    providerSignature: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    paymentMethod: {
      type: String,
      default: 'card'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

PaymentSchema.index({ user: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
