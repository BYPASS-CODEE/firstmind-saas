import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, User, hashPassword, verifyPassword } from '../db';
import { AuthenticatedRequest, createSession, recordAuditLog, createNotification } from '../auth';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, referralCode } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required fields.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const emailClean = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailClean)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.',
        requestId: crypto.randomUUID()
      }
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const schema = db.getSchema();
  if (schema.users.some(u => u.email === emailClean)) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
        requestId: crypto.randomUUID()
      }
    });
  }

  // Handle optional referral code
  let referrerUser: User | undefined;
  if (referralCode) {
    const cleanRef = String(referralCode).trim().toUpperCase();
    referrerUser = schema.users.find(u => u.referralCode.toUpperCase() === cleanRef);
  }

  const userId = `usr_${crypto.randomUUID()}`;
  const userReferralCode = `FM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const newUser: User = {
    id: userId,
    email: emailClean,
    passwordHash: hashPassword(password),
    name: String(name).trim(),
    role: 'USER',
    status: 'ACTIVE',
    isEmailVerified: true, // Marked verified for instant access in environment
    timezone: 'UTC',
    language: 'en',
    referralCode: userReferralCode,
    referredBy: referrerUser ? referrerUser.id : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.transaction(s => {
    s.users.push(newUser);

    // If referred, establish referral record
    if (referrerUser && referrerUser.id !== newUser.id) {
      s.referrals.push({
        id: `ref_${crypto.randomUUID()}`,
        referrerUserId: referrerUser.id,
        referredUserId: newUser.id,
        referralCode: referrerUser.referralCode,
        status: 'REGISTERED',
        commissionAmount: 1.00,
        currency: 'USD',
        createdAt: new Date().toISOString()
      });

      createNotification(
        referrerUser.id,
        'REFERRAL_COMMISSION',
        'New Referral Signup',
        `A new user registered using your referral code. You will earn $1.00 when they make their first qualifying purchase!`,
        { referredUserId: newUser.id }
      );
    }
  });

  const session = createSession(newUser.id, req);

  recordAuditLog(
    { id: newUser.id, email: newUser.email },
    'USER_REGISTERED',
    'USER',
    newUser.id,
    { referredBy: referrerUser ? referrerUser.id : null },
    req.ip
  );

  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        referralCode: newUser.referralCode,
        language: newUser.language,
        timezone: newUser.timezone
      },
      token: session.token,
      expiresAt: session.expiresAt
    }
  });
});

// POST /api/auth/login
authRouter.post('/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const emailClean = String(email).trim().toLowerCase();
  const schema = db.getSchema();
  const user = schema.users.find(u => u.email === emailClean);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password.',
        requestId: crypto.randomUUID()
      }
    });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_SUSPENDED',
        message: 'This account has been suspended by an administrator.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const session = createSession(user.id, req);

  recordAuditLog(
    { id: user.id, email: user.email },
    'USER_LOGGED_IN',
    'USER',
    user.id,
    {},
    req.ip
  );

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        referralCode: user.referralCode,
        language: user.language,
        timezone: user.timezone
      },
      token: session.token,
      expiresAt: session.expiresAt
    }
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    db.transaction(schema => {
      schema.sessions = schema.sessions.filter(s => s.token !== req.sessionToken);
    });

    if (req.user) {
      recordAuditLog(
        { id: req.user.id, email: req.user.email },
        'USER_LOGGED_OUT',
        'SESSION',
        req.sessionToken,
        {},
        req.ip
      );
    }
  }

  return res.json({ success: true, data: { message: 'Logged out successfully.' } });
});

// GET /api/auth/me
authRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'No active authenticated session.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const schema = db.getSchema();
  const subscription = schema.subscriptions.find(s => s.userId === req.user!.id && s.status === 'ACTIVE');
  const plan = subscription ? schema.subscriptionPlans.find(p => p.id === subscription.planId) : null;

  return res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        referralCode: req.user.referralCode,
        language: req.user.language,
        timezone: req.user.timezone,
        createdAt: req.user.createdAt
      },
      subscription: subscription ? {
        id: subscription.id,
        planName: plan?.name || 'Custom',
        tier: plan?.tier || 'STARTER',
        status: subscription.status,
        creditsTotal: subscription.creditsTotal,
        creditsUsed: subscription.creditsUsed,
        creditsRemaining: subscription.creditsTotal - subscription.creditsUsed,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : null
    }
  });
});

// POST /api/auth/verify-email
authRouter.post('/verify-email', (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_EMAIL', message: 'Email is required.', requestId: crypto.randomUUID() }
    });
  }

  db.transaction(schema => {
    const user = schema.users.find(u => u.email === String(email).trim().toLowerCase());
    if (user) {
      user.isEmailVerified = true;
      user.updatedAt = new Date().toISOString();
    }
  });

  return res.json({ success: true, data: { message: 'Email address verified successfully.' } });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  // Professional security standard: always return success message to prevent user enumeration
  return res.json({
    success: true,
    data: { message: 'If an account exists with this email address, password reset instructions have been dispatched.' }
  });
});

// POST /api/auth/dev-test-session (Development AI Test Mode ONLY)
authRouter.post('/dev-test-session', (req: AuthenticatedRequest, res: Response) => {
  const isDevTestAllowed = process.env.DEV_AI_TEST_MODE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.DEV_AI_TEST_MODE !== 'false');
  if (!isDevTestAllowed) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'DEV_TEST_DISABLED',
        message: 'Development AI Test Mode is disabled in production environments.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const schema = db.getSchema();
  let devUser = schema.users.find(u => u.id === 'usr_dev_test');
  if (!devUser) {
    devUser = {
      id: 'usr_dev_test',
      email: 'dev-tester@firstmind.local',
      passwordHash: 'DEV_TEST_ONLY_AUTH',
      name: 'Development Tester',
      role: 'USER',
      status: 'ACTIVE',
      isEmailVerified: true,
      timezone: 'UTC',
      language: 'en',
      referralCode: 'FM-DEVTEST',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.transaction(s => s.users.push(devUser!));
  }

  const session = createSession(devUser.id, req);

  return res.json({
    success: true,
    data: {
      user: {
        id: devUser.id,
        email: devUser.email,
        name: devUser.name,
        role: devUser.role,
        isEmailVerified: true,
        referralCode: devUser.referralCode,
        language: devUser.language,
        timezone: devUser.timezone,
        isDevTest: true
      },
      token: session.token,
      expiresAt: session.expiresAt,
      isDevTest: true
    }
  });
});

