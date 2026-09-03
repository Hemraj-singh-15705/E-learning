import { Router } from 'express';
import {
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getMySubscriptions,
  cancelSubscription,
  getMyInvoices,
  getInvoice
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook endpoint (public with provider signature verification)
router.post('/webhook', handleWebhook);

// Protected Payment & Billing Routes
router.use(authenticate);

router.post('/checkout', createCheckoutSession);
router.post('/verify', verifyPayment);
router.get('/my-payments', getMyPayments);
router.get('/my-subscriptions', getMySubscriptions);
router.post('/subscriptions/:id/cancel', cancelSubscription);
router.get('/my-invoices', getMyInvoices);
router.get('/invoices/:id', getInvoice);

export default router;
