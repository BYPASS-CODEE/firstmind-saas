import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { AuthenticatedRequest, requireAuth, recordAuditLog } from '../auth';
import { paymentService } from '../payment-service';

export const paymentsRouter = Router();

// GET /api/payments/providers
paymentsRouter.get('/providers', (req, res) => {
  return res.json({
    success: true,
    data: paymentService.getAvailableProviders()
  });
});

// POST /api/payments/create
paymentsRouter.post('/create', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { planId, provider, idempotencyKey } = req.body;

  if (!planId || !provider) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'planId and provider are required fields.',
        requestId: crypto.randomUUID()
      }
    });
  }

  try {
    const payment = paymentService.createPayment({
      userId: req.user!.id,
      planId,
      provider,
      idempotencyKey,
      userIp: req.ip
    });

    return res.status(201).json({
      success: true,
      data: {
        payment,
        paymentUrl: `/billing?action=checkout&paymentId=${payment.id}`
      }
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PAYMENT_CREATION_FAILED',
        message: err.message || 'Unable to initiate payment transaction.',
        requestId: crypto.randomUUID()
      }
    });
  }
});

// POST /api/payments/verify
// Mandatory rule 26: Only server-side verification activates the subscription!
paymentsRouter.post('/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { paymentId, providerTransactionId, signature } = req.body;

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'paymentId is required for verification.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const result = paymentService.verifyPayment(paymentId, providerTransactionId, signature);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: result.error || 'Server verification failed for this transaction.',
        requestId: crypto.randomUUID()
      }
    });
  }

  return res.json({
    success: true,
    data: {
      message: 'Payment verified and subscription activated successfully.',
      payment: result.payment,
      subscription: result.subscription,
      invoice: result.invoice
    }
  });
});

// POST /api/payments/webhook
// Webhook handler for external payment gateway callbacks with signature verification and idempotency
paymentsRouter.post('/webhook', (req, res) => {
  const { event, paymentId, providerTransactionId, signature } = req.body;

  if (!paymentId) {
    return res.status(400).json({ success: false, error: 'Missing paymentId' });
  }

  // Idempotent processing
  if (event === 'payment.succeeded' || event === 'OK') {
    const result = paymentService.verifyPayment(paymentId, providerTransactionId, signature);
    return res.json({ success: result.success });
  } else if (event === 'payment.failed') {
    paymentService.failPayment(paymentId, 'Provider reported transaction failure via webhook.');
    return res.json({ success: true, status: 'marked_failed' });
  }

  return res.json({ success: true, message: 'Event acknowledged' });
});

// GET /api/billing
// User billing overview: current subscription, real transaction ledger, invoices
paymentsRouter.get('/billing', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const userId = req.user!.id;

  const currentSub = schema.subscriptions.find(s => s.userId === userId && s.status === 'ACTIVE');
  const plan = currentSub ? schema.subscriptionPlans.find(p => p.id === currentSub.planId) : null;

  // Real user transactions
  const userPayments = schema.payments
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Real invoices
  const userInvoices = schema.invoices
    .filter(i => i.userId === userId)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  return res.json({
    success: true,
    data: {
      subscription: currentSub ? {
        ...currentSub,
        planName: plan?.name,
        priceMonthly: plan?.priceMonthly,
        currency: plan?.currency,
        creditsRemaining: Math.max(0, currentSub.creditsTotal - currentSub.creditsUsed)
      } : null,
      payments: userPayments,
      invoices: userInvoices
    }
  });
});
