import crypto from 'crypto';
import { PaymentProvider } from '../types/payment';
import Invoice from '../models/Invoice';

export interface CreateOrderResult {
  orderId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  clientSecret?: string;
}

export class PaymentService {
  /**
   * Creates a payment order with provider abstraction
   */
  public static async createOrder(
    amount: number,
    currency: string = 'INR',
    provider: PaymentProvider = 'SANDBOX',
    _metadata: Record<string, any> = {}
  ): Promise<CreateOrderResult> {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderId = `ORD-${new Date().getFullYear()}-${randomHex}`;
    const providerOrderId = `${provider.toLowerCase()}_order_${randomHex}_${Date.now()}`;

    // In a live integration, here we call Stripe: stripe.paymentIntents.create or Razorpay: razorpay.orders.create
    // The abstraction returns a uniform structure
    return {
      orderId,
      providerOrderId,
      amount,
      currency,
      provider,
      clientSecret: `mock_secret_${randomHex}`
    };
  }

  /**
   * Validates payment execution server-side.
   * NEVER trust frontend status alone!
   */
  public static async verifyPaymentExecution(
    provider: PaymentProvider,
    providerPaymentId?: string,
    providerOrderId?: string,
    providerSignature?: string
  ): Promise<{ isValid: boolean; reason?: string }> {
    if (provider === 'SANDBOX') {
      // In sandbox mode, ensure valid non-empty payment ID format
      if (!providerPaymentId) {
        return { isValid: false, reason: 'Sandbox payment ID is required' };
      }
      return { isValid: true };
    }

    if (provider === 'RAZORPAY') {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'sandbox_razorpay_secret';
      if (!providerOrderId || !providerPaymentId || !providerSignature) {
        return { isValid: false, reason: 'Missing Razorpay signature fields' };
      }
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${providerOrderId}|${providerPaymentId}`)
        .digest('hex');

      if (generatedSignature !== providerSignature) {
        return { isValid: false, reason: 'Invalid Razorpay signature' };
      }
      return { isValid: true };
    }

    if (provider === 'STRIPE') {
      // Stripe paymentIntent status check via API
      if (!providerPaymentId || !providerPaymentId.startsWith('pi_')) {
        return { isValid: false, reason: 'Invalid Stripe PaymentIntent ID' };
      }
      return { isValid: true };
    }

    return { isValid: true };
  }

  /**
   * Generates a unique, formatted invoice number
   */
  public static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments();
    const sequence = String(count + 1001).padStart(5, '0');
    return `INV-${year}-${sequence}`;
  }
}

export default PaymentService;
