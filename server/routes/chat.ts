import { Router, Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest, requireAuth } from '../auth';
import { aiService } from '../ai-service';

export const chatRouter = Router();

// POST /api/chat (accessible without login for guest users too)
chatRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  let { conversationId, messages, message, systemInstruction, temperature } = req.body;

  if ((!messages || !Array.isArray(messages) || messages.length === 0) && message) {
    messages = [{ role: 'user', content: String(message).trim() }];
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'A messages array with at least one user message or a message string is required.',
        requestId: crypto.randomUUID()
      }
    });
  }

  // Validate the latest message has content
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content || !String(lastMessage.content).trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_MESSAGE',
        message: 'The message cannot be empty.',
        requestId: crypto.randomUUID()
      }
    });
  }

  try {
    const result = await aiService.generateChat({
      conversationId,
      messages,
      systemInstruction,
      temperature
    });

    return res.json({
      success: true,
      data: {
        conversationId: conversationId || `conv_${crypto.randomUUID()}`,
        message: result.message,
        model: result.model,
        provider: result.provider
      }
    });
  } catch (err: any) {
    const errCode = err?.code || 'CHAT_ERROR';
    const errMsg = err?.message || 'Failed to generate chat response.';

    return res.status(500).json({
      success: false,
      error: {
        code: errCode,
        message: errMsg,
        requestId: crypto.randomUUID()
      }
    });
  }
});

// GET /api/chat/status
chatRouter.get('/status', (req, res) => {
  const status = aiService.getProviderStatus();
  res.json({
    success: true,
    data: {
      provider: status.provider,
      chatModel: status.chatModel,
      isConfigured: status.isConfigured
    }
  });
});
