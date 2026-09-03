import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import Coupon from '../models/Coupon';
import Invoice from '../models/Invoice';
import Enrollment from '../models/Enrollment';
import PaymentService from '../services/paymentService';
import { AppError } from '../utils/errors';
import { createNotification } from '../utils/notificationHelper';

// 1. Create Checkout Session / Order
export const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId, couponCode, provider = 'SANDBOX', paymentMethod = 'card' } = req.body;
    const userId = req.user?.id;

    if (!planId) {
      return next(new AppError('Plan ID is required', 400));
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.active) {
      return next(new AppError('Selected pricing plan is not active or available', 404));
    }

    let finalAmount = plan.price;
    let discountAmount = 0;
    let verifiedCoupon: any = null;

    // Server-side Coupon validation & discount calculation
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        active: true
      });

      if (coupon) {
        const now = new Date();
        const isValidDate = (!coupon.startDate || now >= coupon.startDate) && (!coupon.endDate || now <= coupon.endDate);
        const hasUsesLeft = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const notUsedByUser = !coupon.usedBy || !coupon.usedBy.some((u) => u.toString() === userId);
        const planAllowed = !coupon.applicablePlans || coupon.applicablePlans.length === 0 || coupon.applicablePlans.some((p) => p.toString() === planId);

        if (isValidDate && hasUsesLeft && notUsedByUser && planAllowed) {
          if (coupon.type === 'PERCENTAGE') {
            discountAmount = (coupon.value / 100) * plan.price;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(coupon.value, plan.price);
          }
          finalAmount = Math.max(0, plan.price - discountAmount);
          verifiedCoupon = coupon;
        }
      }
    }

    // Call payment provider abstraction
    const orderData = await PaymentService.createOrder(
      finalAmount,
      plan.currency,
      provider,
      {
        planId: plan._id.toString(),
        userId,
        couponCode: verifiedCoupon ? verifiedCoupon.code : undefined,
        discountAmount
      }
    );

    // Create Payment in PENDING status
    const payment = await Payment.create({
      user: userId,
      orderId: orderData.orderId,
      amount: finalAmount,
      currency: plan.currency,
      provider,
      providerOrderId: orderData.providerOrderId,
      status: 'PENDING',
      paymentMethod,
      metadata: {
        planId: plan._id.toString(),
        planName: plan.name,
        originalPrice: plan.price,
        discountAmount,
        couponCode: verifiedCoupon?.code
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        paymentId: payment._id,
        orderId: orderData.orderId,
        providerOrderId: orderData.providerOrderId,
        amount: finalAmount,
        originalPrice: plan.price,
        discountAmount,
        currency: plan.currency,
        provider,
        clientSecret: orderData.clientSecret,
        plan: {
          _id: plan._id,
          name: plan.name,
          duration: plan.duration,
          billingInterval: plan.billingInterval
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Server-side Verify Payment
export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId, providerPaymentId, providerOrderId, providerSignature } = req.body;
    const userId = req.user?.id;

    if (!paymentId) {
      return next(new AppError('Payment ID is required', 400));
    }

    const payment = await Payment.findOne({ _id: paymentId, user: userId });
    if (!payment) {
      return next(new AppError('Payment record not found', 404));
    }

    if (payment.status === 'SUCCESS') {
      res.status(200).json({
        status: 'success',
        message: 'Payment already verified',
        data: { payment }
      });
      return;
    }

    // Strict server-side verification using provider abstraction
    const verification = await PaymentService.verifyPaymentExecution(
      payment.provider,
      providerPaymentId || `sandbox_pay_${Date.now()}`,
      providerOrderId || payment.providerOrderId,
      providerSignature
    );

    if (!verification.isValid) {
      payment.status = 'FAILED';
      await payment.save();
      return next(new AppError(`Payment verification failed: ${verification.reason || 'Invalid signature'}`, 400));
    }

    // 1. Mark payment as SUCCESS
    payment.status = 'SUCCESS';
    payment.providerPaymentId = providerPaymentId || `sandbox_pay_${Date.now()}`;
    payment.providerSignature = providerSignature || undefined;
    payment.paidAt = new Date();
    await payment.save();

    // 2. Handle coupon usage tracking
    if (payment.metadata?.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: payment.metadata.couponCode },
        {
          $inc: { usedCount: 1 },
          $addToSet: { usedBy: userId }
        }
      );
    }

    // 3. Create or update Subscription
    const planId = payment.metadata?.planId;
    const plan = await Plan.findById(planId);
    const durationDays = plan?.duration || 30;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      user: userId,
      plan: planId,
      startDate,
      endDate,
      status: 'ACTIVE',
      payment: payment._id,
      autoRenew: plan?.billingInterval !== 'ONE_TIME' && plan?.billingInterval !== 'LIFETIME'
    });

    // 4. Generate unique Invoice
    const invoiceNumber = await PaymentService.generateInvoiceNumber();
    const invoice = await Invoice.create({
      invoiceNumber,
      user: userId,
      payment: payment._id,
      items: [
        {
          description: `${plan?.name || 'Platform Membership'} (${plan?.billingInterval || 'MONTHLY'})`,
          quantity: 1,
          unitPrice: payment.metadata?.originalPrice || payment.amount,
          total: payment.amount
        }
      ],
      subtotal: payment.metadata?.originalPrice || payment.amount,
      discount: payment.metadata?.discountAmount || 0,
      tax: 0,
      total: payment.amount,
      currency: payment.currency,
      issuedAt: new Date(),
      status: 'PAID'
    });

    // 5. If plan links to batches, auto-enroll student into cohort batches
    if (plan?.applicableBatches && plan.applicableBatches.length > 0) {
      for (const batchId of plan.applicableBatches) {
        await Enrollment.findOneAndUpdate(
          { student: userId, batch: batchId },
          {
            $set: {
              student: userId,
              batch: batchId,
              status: 'ACTIVE',
              enrolledAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    }

    // 6. Send System Notification
    await createNotification({
      recipient: userId,
      type: 'SYSTEM',
      title: 'Payment Successful & Plan Activated',
      message: `Your payment of ${payment.currency} ${payment.amount} for "${plan?.name}" was confirmed. Invoice #${invoice.invoiceNumber} has been generated.`,
      link: `/student/billing`
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified and subscription activated!',
      data: {
        payment,
        subscription,
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Webhook Receiver (Provider callbacks)
export const handleWebhook = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Acknowledge webhook receipt
    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// 4. Get Logged-in User's Payments History
export const getMyPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Logged-in User's Active Subscriptions
export const getMySubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const subscriptions = await Subscription.find({ user: userId })
      .populate('plan')
      .populate('payment')
      .sort({ createdAt: -1 })
      .lean();

    const activeSubscription = subscriptions.find((s) => s.status === 'ACTIVE') || null;

    res.status(200).json({
      status: 'success',
      data: {
        activeSubscription,
        subscriptions
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Cancel Subscription
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const query: any = { _id: id };
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      query.user = userId;
    }

    const subscription = await Subscription.findOne(query);
    if (!subscription) {
      return next(new AppError('Subscription not found', 404));
    }

    subscription.status = 'CANCELLED';
    subscription.autoRenew = false;
    subscription.canceledAt = new Date();
    await subscription.save();

    res.status(200).json({
      status: 'success',
      message: 'Subscription has been cancelled successfully',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get User Invoices
export const getMyInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const invoices = await Invoice.find({ user: userId })
      .populate('payment')
      .sort({ issuedAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: invoices.length,
      data: {
        invoices
      }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get Single Invoice
export const getInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const query: any = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { invoiceNumber: id };

    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      query.user = userId;
    }

    const invoice = await Invoice.findOne(query)
      .populate('user', 'name email')
      .populate('payment')
      .lean();

    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};
