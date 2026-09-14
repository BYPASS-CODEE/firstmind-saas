import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { AuthenticatedRequest, requireAuth, recordAuditLog, createNotification } from '../auth';

export const subscriptionsRouter = Router();

// GET /api/subscriptions/current
subscriptionsRouter.get('/current', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const userId = req.user!.id;
  const sub = schema.subscriptions.find(s => s.userId === userId && s.status === 'ACTIVE');

  if (!sub) {
    return res.json({
      success: true,
      data: null
    });
  }

  const plan = schema.subscriptionPlans.find(p => p.id === sub.planId);

  return res.json({
    success: true,
    data: {
      ...sub,
      planName: plan?.name,
      tier: plan?.tier,
      priceMonthly: plan?.priceMonthly,
      currency: plan?.currency,
      allowedTools: plan?.allowedTools,
      maxQuality: plan?.maxQuality,
      creditsRemaining: Math.max(0, sub.creditsTotal - sub.creditsUsed)
    }
  });
});

// POST /api/subscriptions/cancel
subscriptionsRouter.post('/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const userId = req.user!.id;
  const sub = schema.subscriptions.find(s => s.userId === userId && s.status === 'ACTIVE');

  if (!sub) {
    return res.status(404).json({
      success: false,
      error: { code: 'NO_ACTIVE_SUBSCRIPTION', message: 'No active subscription found to cancel.', requestId: crypto.randomUUID() }
    });
  }

  db.transaction(s => {
    sub.autoRenew = false;
    sub.status = 'CANCELLED';
    sub.updatedAt = new Date().toISOString();
  });

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email },
    'SUBSCRIPTION_CANCELLED',
    'SUBSCRIPTION',
    sub.id,
    {},
    req.ip
  );

  createNotification(
    userId,
    'SECURITY_ALERT',
    'Subscription Auto-Renew Cancelled',
    'Your subscription will not renew at the end of the current billing period.',
    { subscriptionId: sub.id }
  );

  return res.json({
    success: true,
    data: { message: 'Subscription auto-renew successfully cancelled.', subscription: sub }
  });
});
