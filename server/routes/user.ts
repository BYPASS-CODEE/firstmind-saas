import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword } from '../db';
import { AuthenticatedRequest, requireAuth, recordAuditLog } from '../auth';

export const userRouter = Router();

// GET /api/me
userRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const user = req.user!;
  const sub = schema.subscriptions.find(s => s.userId === user.id && s.status === 'ACTIVE');
  const plan = sub ? schema.subscriptionPlans.find(p => p.id === sub.planId) : null;

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        timezone: user.timezone,
        language: user.language,
        referralCode: user.referralCode,
        createdAt: user.createdAt
      },
      subscription: sub ? {
        id: sub.id,
        planName: plan?.name || 'Custom',
        tier: plan?.tier || 'STARTER',
        status: sub.status,
        creditsTotal: sub.creditsTotal,
        creditsUsed: sub.creditsUsed,
        creditsRemaining: Math.max(0, sub.creditsTotal - sub.creditsUsed),
        currentPeriodEnd: sub.currentPeriodEnd,
        autoRenew: sub.autoRenew
      } : null
    }
  });
});

// PUT /api/profile
userRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, timezone, language } = req.body;
  const user = req.user!;

  db.transaction(schema => {
    const target = schema.users.find(u => u.id === user.id);
    if (target) {
      if (name) target.name = String(name).trim();
      if (timezone) target.timezone = String(timezone).trim();
      if (language) target.language = String(language).trim();
      target.updatedAt = new Date().toISOString();
    }
  });

  recordAuditLog(
    { id: user.id, email: user.email },
    'PROFILE_UPDATED',
    'USER',
    user.id,
    { name, timezone, language },
    req.ip
  );

  return res.json({
    success: true,
    data: {
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: name || user.name,
        timezone: timezone || user.timezone,
        language: language || user.language
      }
    }
  });
});

// PUT /api/profile/password
userRouter.put('/profile/password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Current password and new password are required.', requestId: crypto.randomUUID() }
    });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({
      success: false,
      error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 8 characters.', requestId: crypto.randomUUID() }
    });
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password does not match.', requestId: crypto.randomUUID() }
    });
  }

  db.transaction(schema => {
    const target = schema.users.find(u => u.id === user.id);
    if (target) {
      target.passwordHash = hashPassword(newPassword);
      target.updatedAt = new Date().toISOString();
    }
  });

  recordAuditLog(
    { id: user.id, email: user.email },
    'PASSWORD_CHANGED',
    'USER',
    user.id,
    {},
    req.ip
  );

  return res.json({ success: true, data: { message: 'Password changed successfully.' } });
});

// GET /api/dashboard
userRouter.get('/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const userId = req.user!.id;

  const subscription = schema.subscriptions.find(s => s.userId === userId && s.status === 'ACTIVE');
  const plan = subscription ? schema.subscriptionPlans.find(p => p.id === subscription.planId) : null;

  // Real generations (strictly no fake ones!)
  const userGenerations = schema.generationJobs
    .filter(j => j.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Real user payments
  const userPayments = schema.payments
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Real referral earnings
  const userReferrals = schema.referrals.filter(r => r.referrerUserId === userId);
  const userReferralLedger = schema.referralLedger.filter(r => r.referrerUserId === userId && r.status === 'APPROVED');
  const totalReferralEarnings = userReferralLedger.reduce((sum, item) => sum + item.amount, 0);

  // Unread notifications
  const notifications = schema.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return res.json({
    success: true,
    data: {
      subscription: subscription ? {
        id: subscription.id,
        planName: plan?.name || 'Custom Plan',
        tier: plan?.tier || 'STARTER',
        status: subscription.status,
        creditsTotal: subscription.creditsTotal,
        creditsUsed: subscription.creditsUsed,
        creditsRemaining: Math.max(0, subscription.creditsTotal - subscription.creditsUsed),
        currentPeriodEnd: subscription.currentPeriodEnd,
        autoRenew: subscription.autoRenew
      } : null,
      stats: {
        totalGenerations: userGenerations.length,
        completedGenerations: userGenerations.filter(g => g.status === 'COMPLETED').length,
        failedGenerations: userGenerations.filter(g => g.status === 'FAILED').length,
        referralEarnings: totalReferralEarnings,
        successfulReferralsCount: userReferrals.filter(r => r.status === 'COMMISSIONED').length
      },
      recentGenerations: userGenerations.slice(0, 6),
      recentPayments: userPayments,
      notifications
    }
  });
});

// GET /api/notifications
userRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const userId = req.user!.id;
  const userNotifications = schema.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ success: true, data: userNotifications });
});

// PUT /api/notifications/:id/read
userRouter.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  db.transaction(schema => {
    const notif = schema.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
    }
  });

  return res.json({ success: true, data: { message: 'Notification marked as read.' } });
});

// PUT /api/notifications/read-all
userRouter.put('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  db.transaction(schema => {
    for (const notif of schema.notifications) {
      if (notif.userId === userId) {
        notif.isRead = true;
      }
    }
  });

  return res.json({ success: true, data: { message: 'All notifications marked as read.' } });
});
