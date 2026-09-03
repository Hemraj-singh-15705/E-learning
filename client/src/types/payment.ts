export type BillingInterval = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME' | 'ONE_TIME';
export type PaymentProvider = 'STRIPE' | 'RAZORPAY' | 'PAYPAL' | 'SANDBOX';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface IPlanLimits {
  maxCourses?: number;
  mentorSessionsPerMonth?: number;
  testAttemptsLimit?: number;
  certificateIncluded?: boolean;
}

export interface IPlan {
  _id: string;
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
  applicableCourses?: any[];
  applicableBatches?: any[];
  isPopular?: boolean;
}

export interface IPayment {
  _id: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  metadata?: {
    planId?: string;
    planName?: string;
    originalPrice?: number;
    discountAmount?: number;
    couponCode?: string;
    [key: string]: any;
  };
  paidAt?: string;
  createdAt: string;
}

export interface ISubscription {
  _id: string;
  plan: IPlan;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  payment?: IPayment;
  autoRenew: boolean;
  canceledAt?: string;
  createdAt: string;
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice {
  _id: string;
  invoiceNumber: string;
  payment?: IPayment;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  issuedAt: string;
  status: 'PAID' | 'REFUNDED' | 'VOID';
}

export interface ICoupon {
  _id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  applicablePlans?: IPlan[];
}
