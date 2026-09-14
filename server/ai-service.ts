import { aiService as modularAIService, StoredGenerationResult } from './services/ai/AIService';
import { ImageGenerationOptions, ChatGenerationOptions, ChatGenerationOutput } from './services/ai/AIProvider';

export { aiService } from './services/ai/AIService';
export * from './services/ai/AIProvider';

export interface ImageGenerationRequest extends ImageGenerationOptions {
  tool: 'TEXT_TO_IMAGE' | 'IMAGE_TO_IMAGE' | 'VARIATION' | 'ENHANCE' | 'STYLE_TRANSFER';
}

export interface VideoGenerationRequest {
  tool: 'TEXT_TO_VIDEO' | 'IMAGE_TO_VIDEO';
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  sourceImageBase64?: string;
  sourceImageMimeType?: string;
}

export interface GenerationResult extends StoredGenerationResult {}
