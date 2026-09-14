import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

import { db } from './server/db';
import { authenticateUser } from './server/auth';
import { authRouter } from './server/routes/auth';
import { userRouter } from './server/routes/user';
import { plansRouter } from './server/routes/plans';
import { subscriptionsRouter } from './server/routes/subscriptions';
import { paymentsRouter } from './server/routes/payments';
import { generationsRouter } from './server/routes/generations';
import { referralsRouter } from './server/routes/referrals';
import { adminRouter } from './server/routes/admin';
import { chatRouter } from './server/routes/chat';
import { aiService } from './server/ai-service';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // Security headers & CORS
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Global session authentication middleware
  app.use(authenticateUser);

  const isDevTestMode = process.env.DEV_AI_TEST_MODE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.DEV_AI_TEST_MODE !== 'false');

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'FIRSTMIND',
      version: '1.0.0-production',
      aiConfigured: aiService.isConfigured(),
      devAiTestMode: isDevTestMode,
      timestamp: new Date().toISOString()
    });
  });

  // Public system configuration for frontend
  app.get('/api/config', (req, res) => {
    const providerStatus = aiService.getProviderStatus();
    res.json({
      success: true,
      data: {
        devAiTestMode: isDevTestMode,
        aiProvider: providerStatus.provider,
        imageModel: providerStatus.imageModel,
        chatModel: providerStatus.chatModel,
        isAiConfigured: providerStatus.isConfigured
      }
    });
  });

  // Public tools metadata
  app.get('/api/tools', (req, res) => {
    res.json({ success: true, data: db.getSchema().aiTools });
  });

  // Mount API modules
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/plans', plansRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/generations', generationsRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/referrals', referralsRouter);
  app.use('/api/admin', adminRouter);

  // Fallback for missing API routes to return typed error
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `API route ${req.method} ${req.url} does not exist.`
      }
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FIRSTMIND] Production-ready SaaS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[FIRSTMIND] Server initialization error:', err);
  process.exit(1);
});
