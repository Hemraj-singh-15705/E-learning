import { Document, Types } from 'mongoose';

export type PaymentProvider = 'STRIPE' | 'RAZORPAY' | 'PAYPAL' | 'SANDBOX';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface IPaymentMetadata {
  planId?: string;
  courseId?: string;
  batchId?: string;
  couponCode?: string;
  discountAmount?: number;
  [key: string]: any;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  orderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerOrderId?: string;
  providerSignature?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  metadata?: IPaymentMetadata;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
