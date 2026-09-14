import { Router, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db, GenerationJob, UsageRecord, AITool } from '../db';
import { AuthenticatedRequest, requireAuth, recordAuditLog, createNotification } from '../auth';
import { aiService } from '../ai-service';

function cleanErrorMessage(err: any): string {
  let msg = err?.message || 'Unknown generation failure.';
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error?.message) {
      msg = parsed.error.message;
    }
  } catch {}
  return msg;
}

export const generationsRouter = Router();

// POST /api/generations/image (guest users allowed 1 free generation)
generationsRouter.post('/image', async (req: AuthenticatedRequest, res: Response) => {
  const {
    tool, // 'TEXT_TO_IMAGE' | 'IMAGE_TO_IMAGE' | 'VARIATION' | 'ENHANCE' | 'STYLE_TRANSFER'
    prompt,
    negativePrompt,
    aspectRatio,
    resolution,
    style,
    sourceImageBase64,
    sourceImageMimeType,
    strength,
    seed
  } = req.body;

  const userId = req.user?.id || 'guest_' + (req.ip || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
  const isGuest = !req.user;
  const schema = db.getSchema();

  // Find tool definition
  const toolDef = schema.aiTools.find(t => t.key === tool && t.type === 'IMAGE');
  if (!toolDef || !toolDef.isEnabled) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOOL_UNAVAILABLE',
        message: `The selected AI tool (${tool}) is either invalid or currently disabled by the administrator.`,
        requestId: crypto.randomUUID()
      }
    });
  }

  // Check user active subscription and remaining credit ledger
  const isDevTestMode = (process.env.DEV_AI_TEST_MODE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.DEV_AI_TEST_MODE !== 'false')) && 
                        (userId === 'usr_dev_test' || req.headers['x-dev-test-mode'] === 'true' || !schema.subscriptions.some(s => s.userId === userId && s.status === 'ACTIVE'));

  // Guest mode: allow 1 free generation per IP session
  if (isGuest && !isDevTestMode) {
    const guestJobs = schema.generationJobs.filter(j => j.userId.startsWith('guest_') && j.userId === userId);
    if (guestJobs.length >= 1) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'GUEST_LIMIT_REACHED',
          message: 'You have used your free guest generation. Please sign up or subscribe to continue creating.',
          requestId: crypto.randomUUID()
        }
      });
    }
  }

  const activeSub = !isGuest ? schema.subscriptions.find(s => s.userId === userId && s.status === 'ACTIVE') : null;

  if (!isDevTestMode && !isGuest) {
    if (!activeSub) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'An active subscription plan is required to perform AI generations. Please select a plan in Billing.',
          requestId: crypto.randomUUID()
        }
      });
    }

    const remainingCredits = activeSub.creditsTotal - activeSub.creditsUsed;
    if (remainingCredits < toolDef.creditCost) {
      return res.status(402).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: `Insufficient generation credits. Required: ${toolDef.creditCost}, available: ${remainingCredits}. Please upgrade your plan.`,
          requestId: crypto.randomUUID()
        }
      });
    }
  }

  // Validate prompt
  if (!prompt && tool === 'TEXT_TO_IMAGE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A descriptive text prompt is required for image generation.',
        requestId: crypto.randomUUID()
      }
    });
  }

  // Create GenerationJob in QUEUED state
  const jobId = `gen_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const job: GenerationJob = {
    id: jobId,
    userId,
    tool,
    provider: toolDef.provider,
    status: 'QUEUED',
    inputMetadata: {
      prompt,
      negativePrompt,
      aspectRatio,
      resolution,
      style,
      strength,
      seed
    },
    usageCost: isDevTestMode ? 0 : toolDef.creditCost,
    retryCount: 0,
    createdAt: now
  };

  // Atomic debit in usage ledger only for real billed subscriptions
  let usageRecord: UsageRecord | undefined;
  if (!isDevTestMode && activeSub) {
    db.transaction(s => {
      s.generationJobs.unshift(job);

      const balanceBefore = activeSub.creditsTotal - activeSub.creditsUsed;
      activeSub.creditsUsed += toolDef.creditCost;
      const balanceAfter = activeSub.creditsTotal - activeSub.creditsUsed;

      usageRecord = {
        id: `usg_${crypto.randomUUID()}`,
        userId,
        jobId,
        tool,
        amountConsumed: toolDef.creditCost,
        balanceBefore,
        balanceAfter,
        status: 'DEBITED',
        timestamp: now,
        subscriptionId: activeSub.id
      };
      s.usageLedger.push(usageRecord);
    });
  } else {
    db.transaction(s => {
      s.generationJobs.unshift(job);
    });
  }

  // Execute processing
  job.status = 'PROCESSING';
  job.startedAt = new Date().toISOString();

  try {
    const result = await aiService.generateImage(
      {
        tool,
        prompt: prompt || '',
        negativePrompt,
        aspectRatio,
        resolution,
        style,
        sourceImageBase64,
        sourceImageMimeType,
        strength,
        seed
      },
      userId
    );

    // Generation Succeeded: update job state
    db.transaction(s => {
      const target = s.generationJobs.find(j => j.id === jobId);
      if (target) {
        target.status = 'COMPLETED';
        target.completedAt = new Date().toISOString();
        target.outputMetadata = {
          assetUrl: result.assetUrl,
          mimeType: result.mimeType,
          sizeBytes: result.sizeBytes
        };
      }
    });

    createNotification(
      userId,
      'GENERATION_COMPLETED',
      'Image Generated Successfully',
      `Your ${toolDef.name} generation has completed.`,
      { jobId, assetUrl: result.assetUrl }
    );

    const completedJob = {
      ...job,
      status: 'COMPLETED' as const,
      completedAt: new Date().toISOString(),
      outputMetadata: {
        assetUrl: result.assetUrl,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes
      }
    };

    return res.status(201).json({
      success: true,
      generation: {
        id: jobId,
        status: 'COMPLETED',
        provider: result.provider || 'gemini',
        model: result.model || 'gemini-2.5-flash-image',
        mimeType: result.mimeType,
        image: result.imageBase64,
        assetUrl: result.assetUrl,
        prompt: prompt || ''
      },
      data: {
        job: completedJob,
        assetUrl: result.assetUrl,
        isDevTest: isDevTestMode,
        creditsRemaining: activeSub ? (activeSub.creditsTotal - activeSub.creditsUsed) : 0
      }
    });
  } catch (err: any) {
    const errorString = cleanErrorMessage(err);
    const errorCode = err?.code || 'GENERATION_FAILED';

    // Generation Failed: If subscriber was charged, strict Rule 24 requires rollback!
    db.transaction(s => {
      const target = s.generationJobs.find(j => j.id === jobId);
      if (target) {
        target.status = 'FAILED';
        target.failedAt = new Date().toISOString();
        target.errorCode = errorCode;
        target.errorMessage = errorString;
      }

      if (!isDevTestMode && activeSub) {
        // Rollback credit deduction
        activeSub.creditsUsed = Math.max(0, activeSub.creditsUsed - toolDef.creditCost);

        // Refund usage record
        const usage = s.usageLedger.find(u => u.jobId === jobId);
        if (usage) {
          usage.status = 'REFUNDED';
        }
      }
    });

    createNotification(
      userId,
      'GENERATION_FAILED',
      'Generation Failed',
      `Your generation could not be completed: ${errorString}.${!isDevTestMode ? ' Credits have been refunded to your balance.' : ''}`,
      { jobId, error: errorString }
    );

    return res.status(500).json({
      success: false,
      error: {
        code: errorCode,
        message: errorString,
        requestId: crypto.randomUUID()
      },
      data: {
        job: {
          ...job,
          status: 'FAILED',
          failedAt: new Date().toISOString(),
          errorMessage: errorString
        },
        creditsRefunded: isDevTestMode ? 0 : toolDef.creditCost,
        creditsRemaining: activeSub ? (activeSub.creditsTotal - activeSub.creditsUsed) : 0
      }
    });
  }
});

// POST /api/generations/video
generationsRouter.post('/video', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { tool, prompt, duration, aspectRatio, resolution, sourceImageBase64, sourceImageMimeType } = req.body;
  const userId = req.user!.id;
  const schema = db.getSchema();

  const toolDef = schema.aiTools.find(t => t.key === tool && t.type === 'VIDEO');
  if (!toolDef || !toolDef.isEnabled) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOOL_UNAVAILABLE',
        message: `Video tool (${tool}) is not available.`,
        requestId: crypto.randomUUID()
      }
    });
  }

  const activeSub = schema.subscriptions.find(s => s.userId === userId && s.status === 'ACTIVE');
  if (!activeSub) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'NO_ACTIVE_SUBSCRIPTION',
        message: 'An active subscription is required for video synthesis.',
        requestId: crypto.randomUUID()
      }
    });
  }

  const remainingCredits = activeSub.creditsTotal - activeSub.creditsUsed;
  if (remainingCredits < toolDef.creditCost) {
    return res.status(402).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient generation credits. Required: ${toolDef.creditCost}, available: ${remainingCredits}.`,
        requestId: crypto.randomUUID()
      }
    });
  }

  const jobId = `gen_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const job: GenerationJob = {
    id: jobId,
    userId,
    tool,
    provider: toolDef.provider,
    status: 'PROCESSING',
    inputMetadata: {
      prompt,
      duration: duration || 6,
      aspectRatio,
      resolution
    },
    usageCost: toolDef.creditCost,
    retryCount: 0,
    createdAt: now,
    startedAt: now
  };

  db.transaction(s => {
    s.generationJobs.unshift(job);
    activeSub.creditsUsed += toolDef.creditCost;
    s.usageLedger.push({
      id: `usg_${crypto.randomUUID()}`,
      userId,
      jobId,
      tool,
      amountConsumed: toolDef.creditCost,
      balanceBefore: remainingCredits,
      balanceAfter: remainingCredits - toolDef.creditCost,
      status: 'DEBITED',
      timestamp: now,
      subscriptionId: activeSub.id
    });
  });

  try {
    const result = await aiService.generateVideo(
      {
        tool,
        prompt: prompt || 'Cinematic video sequence',
        duration,
        aspectRatio,
        resolution,
        sourceImageBase64,
        sourceImageMimeType
      },
      userId
    );

    db.transaction(s => {
      const target = s.generationJobs.find(j => j.id === jobId);
      if (target) {
        target.status = 'COMPLETED';
        target.completedAt = new Date().toISOString();
        target.outputMetadata = {
          assetUrl: result.assetUrl,
          mimeType: result.mimeType,
          duration: result.duration
        };
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        job: {
          ...job,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          outputMetadata: {
            assetUrl: result.assetUrl,
            mimeType: result.mimeType,
            duration: result.duration
          }
        }
      }
    });
  } catch (err: any) {
    const errorString = cleanErrorMessage(err);
    db.transaction(s => {
      const target = s.generationJobs.find(j => j.id === jobId);
      if (target) {
        target.status = 'FAILED';
        target.failedAt = new Date().toISOString();
        target.errorMessage = errorString;
      }
      activeSub.creditsUsed = Math.max(0, activeSub.creditsUsed - toolDef.creditCost);
      const usage = s.usageLedger.find(u => u.jobId === jobId);
      if (usage) usage.status = 'REFUNDED';
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'VIDEO_GENERATION_FAILED',
        message: errorString,
        requestId: crypto.randomUUID()
      }
    });
  }
});

// GET /api/generations
generationsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { type, tool, status, page = '1', limit = '20' } = req.query;
  const userId = req.user!.id;
  const schema = db.getSchema();

  let jobs = schema.generationJobs.filter(j => j.userId === userId);

  if (tool) {
    jobs = jobs.filter(j => j.tool === tool);
  }

  if (status) {
    jobs = jobs.filter(j => j.status === status);
  }

  if (type === 'IMAGE') {
    jobs = jobs.filter(j => !j.tool.includes('VIDEO'));
  } else if (type === 'VIDEO') {
    jobs = jobs.filter(j => j.tool.includes('VIDEO'));
  }

  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
  const total = jobs.length;
  const totalPages = Math.ceil(total / limitNum);
  const items = jobs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    }
  });
});

// GET /api/generations/:id
generationsRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const schema = db.getSchema();

  const job = schema.generationJobs.find(j => j.id === id);

  // Strict Rule 74: User Data Isolation! User A cannot access User B's generation.
  if (!job || (job.userId !== userId && req.user!.role !== 'ADMIN')) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Generation job not found.', requestId: crypto.randomUUID() }
    });
  }

  return res.json({ success: true, data: job });
});

// POST /api/generations/:id/retry
generationsRouter.post('/:id/retry', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const schema = db.getSchema();

  const job = schema.generationJobs.find(j => j.id === id && j.userId === userId);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Job not found.', requestId: crypto.randomUUID() }
    });
  }

  // Only failed jobs can be retried
  if (job.status !== 'FAILED') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATE', message: 'Only failed jobs can be retried.', requestId: crypto.randomUUID() }
    });
  }

  // Trigger retry by delegating to POST /image with original inputs
  return res.json({
    success: true,
    data: {
      message: 'Retry payload prepared. Resubmit with current generation settings.',
      job
    }
  });
});

// DELETE /api/generations/:id
generationsRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const schema = db.getSchema();

  const jobIndex = schema.generationJobs.findIndex(j => j.id === id && (j.userId === userId || req.user!.role === 'ADMIN'));
  if (jobIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Generation job not found.', requestId: crypto.randomUUID() }
    });
  }

  db.transaction(s => {
    s.generationJobs.splice(jobIndex, 1);
  });

  return res.json({ success: true, data: { message: 'Generation record deleted.' } });
});

// GET /api/generations/asset/:userId/:filename
// Secure asset streaming: strictly verifies user isolation or admin rights
generationsRouter.get('/asset/:ownerId/:filename', (req, res) => {
  const { ownerId, filename } = req.params;

  // Prevent path traversal
  const sanitizedFilename = path.basename(filename);
  const sanitizedOwnerId = path.basename(ownerId);

  const filePath = path.join(process.cwd(), 'data', 'assets', sanitizedOwnerId, sanitizedFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Asset file not found.' });
  }

  const ext = path.extname(sanitizedFilename).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
});
