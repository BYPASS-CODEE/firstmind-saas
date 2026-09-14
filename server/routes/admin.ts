import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { AuthenticatedRequest, requireAuth, requireAdmin, recordAuditLog } from '../auth';

export const adminRouter = Router();

// Enforce authentication AND ADMIN role for all routes in this router
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// GET /api/admin/stats
// Strict Rule 34: Show real statistics. If database contains no data, show zero/empty state. Never invent numbers!
adminRouter.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();

  const totalUsers = schema.users.length;
  const activeSubscriptions = schema.subscriptions.filter(s => s.status === 'ACTIVE').length;
  
  // Calculate verified gross revenue
  const verifiedRevenue = schema.payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalGenerations = schema.generationJobs.length;
  const failedJobs = schema.generationJobs.filter(j => j.status === 'FAILED').length;
  const completedJobs = schema.generationJobs.filter(j => j.status === 'COMPLETED').length;
  
  const paymentFailures = schema.payments.filter(p => p.status === 'FAILED').length;
  const totalReferralCommissions = schema.referralLedger
    .filter(l => l.status === 'APPROVED' || l.status === 'PAID')
    .reduce((sum, l) => sum + l.amount, 0);

  return res.json({
    success: true,
    data: {
      totalUsers,
      activeSubscriptions,
      verifiedRevenue,
      totalGenerations,
      completedJobs,
      failedJobs,
      paymentFailures,
      totalReferralCommissions,
      activeAiProvider: schema.settings.activeAiProvider,
      isAiConfigured: Boolean(process.env.GEMINI_API_KEY),
      isPaymentConfigured: Boolean(process.env.PAYMENT_GATEWAY_KEY || process.env.PAYMENT_GATEWAY_MERCHANT_ID)
    }
  });
});

// GET /api/admin/users
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const { search, status, role, page = '1', limit = '20' } = req.query;
  const schema = db.getSchema();

  let list = schema.users.map(u => {
    const sub = schema.subscriptions.find(s => s.userId === u.id && s.status === 'ACTIVE');
    const plan = sub ? schema.subscriptionPlans.find(p => p.id === sub.planId) : null;
    const genCount = schema.generationJobs.filter(j => j.userId === u.id).length;
    const payCount = schema.payments.filter(p => p.userId === u.id && p.status === 'SUCCESS').length;

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      isEmailVerified: u.isEmailVerified,
      referralCode: u.referralCode,
      currentPlan: plan?.name || 'None',
      totalGenerations: genCount,
      totalPayments: payCount,
      createdAt: u.createdAt
    };
  });

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.referralCode.toLowerCase().includes(q));
  }

  if (status) {
    list = list.filter(u => u.status === status);
  }

  if (role) {
    list = list.filter(u => u.role === role);
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const total = list.length;
  const items = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }
  });
});

// PUT /api/admin/users/:id/status
// Suspend or activate user with mandatory audit logging
adminRouter.put('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
    return res.status(400).json({ success: false, error: 'Invalid status. Must be ACTIVE or SUSPENDED.' });
  }

  const schema = db.getSchema();
  const user = schema.users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  if (user.role === 'ADMIN' && status === 'SUSPENDED' && user.id === req.user!.id) {
    return res.status(400).json({ success: false, error: 'Cannot suspend your own administrator account.' });
  }

  db.transaction(s => {
    user.status = status;
    user.updatedAt = new Date().toISOString();
  });

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email },
    `USER_${status}`,
    'USER',
    user.id,
    { previousStatus: user.status, newStatus: status, reason },
    req.ip
  );

  return res.json({ success: true, data: { message: `User status changed to ${status}.`, user } });
});

// POST /api/admin/users/:id/credits
adminRouter.post('/users/:id/credits', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const schema = db.getSchema();

  const user = schema.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  const sub = schema.subscriptions.find(s => s.userId === id && s.status === 'ACTIVE');
  if (!sub) {
    return res.status(400).json({ success: false, error: 'User has no active subscription to adjust credits on.' });
  }

  const creditDelta = Number(amount) || 0;
  db.transaction(s => {
    sub.creditsTotal = Math.max(0, sub.creditsTotal + creditDelta);
  });

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email },
    'USER_CREDITS_ADJUSTED',
    'SUBSCRIPTION',
    sub.id,
    { userId: id, amount: creditDelta, reason },
    req.ip
  );

  return res.json({ success: true, data: { message: 'Credits adjusted successfully.', subscription: sub } });
});

// PUT /api/admin/users/:id/role
adminRouter.put('/users/:id/role', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const schema = db.getSchema();

  if (role !== 'ADMIN' && role !== 'USER') {
    return res.status(400).json({ success: false, error: 'Invalid role.' });
  }

  const user = schema.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  db.transaction(s => {
    user.role = role;
    user.updatedAt = new Date().toISOString();
  });

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email },
    `USER_ROLE_CHANGED`,
    'USER',
    user.id,
    { newRole: role },
    req.ip
  );

  return res.json({ success: true, data: { message: `User role changed to ${role}.`, user } });
});

// GET /api/admin/subscriptions
adminRouter.get('/subscriptions', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();

  const subscriptionsWithDetails = schema.subscriptions.map(s => {
    const user = schema.users.find(u => u.id === s.userId);
    const plan = schema.subscriptionPlans.find(p => p.id === s.planId);
    return {
      ...s,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || 'Unknown',
      planName: plan?.name || 'Unknown',
      planTier: plan?.tier,
      priceMonthly: plan?.priceMonthly
    };
  });

  return res.json({
    success: true,
    data: {
      plans: schema.subscriptionPlans,
      activeSubscriptions: subscriptionsWithDetails
    }
  });
});

// PUT /api/admin/plans/:id
adminRouter.put('/plans/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { priceMonthly, creditLimit, maxQuality, processingPriority, isActive } = req.body;
  const schema = db.getSchema();

  const plan = schema.subscriptionPlans.find(p => p.id === id);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Subscription plan not found.' });
  }

  db.transaction(s => {
    if (priceMonthly !== undefined) plan.priceMonthly = Number(priceMonthly);
    if (creditLimit !== undefined) plan.creditLimit = Number(creditLimit);
    if (maxQuality !== undefined) plan.maxQuality = String(maxQuality);
    if (processingPriority !== undefined) plan.processingPriority = processingPriority;
    if (isActive !== undefined) plan.isActive = Boolean(isActive);
  });

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email },
    'PLAN_CONFIG_UPDATED',
    'SUBSCRIPTION_PLAN',
    plan.id,
    { priceMonthly, creditLimit, maxQuality, processingPriority, isActive },
    req.ip
  );

  return res.json({ success: true, data: plan });
});

// GET /api/admin/payments
adminRouter.get('/payments', (req: AuthenticatedRequest, res: Response) => {
  const { status, provider, search, page = '1', limit = '20' } = req.query;
  const schema = db.getSchema();

  let list = schema.payments.map(p => {
    const user = schema.users.find(u => u.id === p.userId);
    const plan = schema.subscriptionPlans.find(pl => pl.id === p.planId);
    return {
      ...p,
      userName: user?.name || 'User',
      userEmail: user?.email || 'Unknown',
      planName: plan?.name || 'Unknown'
    };
  });

  if (status) {
    list = list.filter(p => p.status === status);
  }

  if (provider) {
    list = list.filter(p => p.provider === provider);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(p => p.transactionReference.toLowerCase().includes(q) || p.userEmail.toLowerCase().includes(q));
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const total = list.length;
  const items = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }
  });
});

// GET /api/admin/generations
adminRouter.get('/generations', (req: AuthenticatedRequest, res: Response) => {
  const { status, tool, page = '1', limit = '25' } = req.query;
  const schema = db.getSchema();

  let list = schema.generationJobs.map(j => {
    const user = schema.users.find(u => u.id === j.userId);
    return {
      ...j,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || 'Unknown'
    };
  });

  if (status) list = list.filter(j => j.status === status);
  if (tool) list = list.filter(j => j.tool === tool);

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
  const total = list.length;
  const items = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }
  });
});

// GET /api/admin/tools
adminRouter.get('/tools', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  return res.json({ success: true, data: schema.aiTools });
});

// PUT /api/admin/tools/:id
adminRouter.put('/tools/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isEnabled, creditCost } = req.body;
  const schema = db.getSchema();

  const tool = schema.aiTools.find(t => t.id === id);
  if (!tool) {
    return res.status(404).json({ success: false, error: 'AI Tool not found.' });
  }

  db.transaction(s => {
    if (isEnabled !== undefined) tool.isEnabled = Boolean(isEnabled);
    if (creditCost !== undefined) tool.creditCost = Math.max(1, Number(creditCost));
  });

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email },
    'AI_TOOL_UPDATED',
    'AI_TOOL',
    tool.id,
    { isEnabled, creditCost },
    req.ip
  );

  return res.json({ success: true, data: tool });
});

// GET /api/admin/referrals
adminRouter.get('/referrals', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();

  const referralsDetailed = schema.referrals.map(r => {
    const referrer = schema.users.find(u => u.id === r.referrerUserId);
    const referred = schema.users.find(u => u.id === r.referredUserId);
    return {
      ...r,
      referrerEmail: referrer?.email || 'Unknown',
      referrerName: referrer?.name || 'Unknown',
      referredEmail: referred?.email || 'Unknown',
      referredName: referred?.name || 'Unknown'
    };
  });

  return res.json({
    success: true,
    data: {
      referrals: referralsDetailed,
      ledger: schema.referralLedger
    }
  });
});

// GET /api/admin/reports
// Strict Rule 40: Reports based ONLY on real database data! Never fabricate data!
adminRouter.get('/reports', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();

  // Aggregate daily counts from real data
  const userGrowthMap: Record<string, number> = {};
  for (const user of schema.users) {
    const day = user.createdAt.split('T')[0];
    userGrowthMap[day] = (userGrowthMap[day] || 0) + 1;
  }

  const revenueMap: Record<string, number> = {};
  for (const pay of schema.payments) {
    if (pay.status === 'SUCCESS') {
      const day = pay.createdAt.split('T')[0];
      revenueMap[day] = (revenueMap[day] || 0) + pay.amount;
    }
  }

  const generationVolumeMap: Record<string, { total: number; failed: number }> = {};
  for (const job of schema.generationJobs) {
    const day = job.createdAt.split('T')[0];
    if (!generationVolumeMap[day]) {
      generationVolumeMap[day] = { total: 0, failed: 0 };
    }
    generationVolumeMap[day].total += 1;
    if (job.status === 'FAILED') {
      generationVolumeMap[day].failed += 1;
    }
  }

  const toolUsageDistribution: Record<string, number> = {};
  for (const job of schema.generationJobs) {
    toolUsageDistribution[job.tool] = (toolUsageDistribution[job.tool] || 0) + 1;
  }

  return res.json({
    success: true,
    data: {
      userGrowth: Object.entries(userGrowthMap).map(([date, count]) => ({ date, count })),
      revenueTimeline: Object.entries(revenueMap).map(([date, amount]) => ({ date, amount })),
      generationVolume: Object.entries(generationVolumeMap).map(([date, data]) => ({ date, ...data })),
      toolUsageDistribution
    }
  });
});

// GET /api/admin/audit
adminRouter.get('/audit', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  return res.json({
    success: true,
    data: schema.auditLogs
  });
});

// GET /api/admin/settings
adminRouter.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  return res.json({
    success: true,
    data: {
      ...schema.settings,
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      paymentKeyConfigured: Boolean(process.env.PAYMENT_GATEWAY_KEY || process.env.PAYMENT_GATEWAY_MERCHANT_ID)
    }
  });
});

// PUT /api/admin/settings
adminRouter.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  const { platformName, maintenanceMode, allowRegistrations, defaultCurrency, referralCommissionAmount } = req.body;
  const schema = db.getSchema();

  db.transaction(s => {
    if (platformName !== undefined) s.settings.platformName = String(platformName).trim();
    if (maintenanceMode !== undefined) s.settings.maintenanceMode = Boolean(maintenanceMode);
    if (allowRegistrations !== undefined) s.settings.allowRegistrations = Boolean(allowRegistrations);
    if (defaultCurrency !== undefined) s.settings.defaultCurrency = String(defaultCurrency).trim();
    if (referralCommissionAmount !== undefined) s.settings.referralCommissionAmount = Number(referralCommissionAmount);
  });

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email },
    'SYSTEM_SETTINGS_UPDATED',
    'SYSTEM_SETTINGS',
    'global',
    { platformName, maintenanceMode, allowRegistrations, defaultCurrency, referralCommissionAmount },
    req.ip
  );

  return res.json({ success: true, data: schema.settings });
});
