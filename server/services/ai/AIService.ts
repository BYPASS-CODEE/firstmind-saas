import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  ImageProvider, 
  ChatProvider, 
  ImageGenerationOptions, 
  ImageGenerationOutput, 
  ChatGenerationOptions, 
  ChatGenerationOutput 
} from './AIProvider';
import { GeminiImageProvider } from './GeminiImageProvider';
import { GeminiChatProvider } from './GeminiChatProvider';

const ASSETS_DIR = path.join(process.cwd(), 'data', 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

export interface StoredGenerationResult {
  id: string;
  status: 'COMPLETED' | 'FAILED';
  assetUrl: string;
  mimeType: string;
  provider: string;
  model: string;
  sizeBytes: number;
  prompt: string;
  imageBase64?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export class AIService {
  private imageProvider: ImageProvider;
  private chatProvider: ChatProvider;

  constructor() {
    this.imageProvider = new GeminiImageProvider();
    this.chatProvider = new GeminiChatProvider();
  }

  public isConfigured(): boolean {
    return this.imageProvider.isConfigured();
  }

  public getProviderStatus() {
    return {
      provider: 'gemini',
      isConfigured: this.isConfigured(),
      imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
      chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash',
      videoSupported: false,
      videoNotice: 'Veo video diffusion engine requires dedicated enterprise video GPU quota. Currently unavailable in test mode.'
    };
  }

  public registerImageProvider(provider: ImageProvider) {
    this.imageProvider = provider;
  }

  public registerChatProvider(provider: ChatProvider) {
    this.chatProvider = provider;
  }

  public async generateImage(options: ImageGenerationOptions, userId: string): Promise<StoredGenerationResult> {
    const output = await this.imageProvider.generateImage(options);

    // Persist asset locally for this user
    const userAssetDir = path.join(ASSETS_DIR, userId);
    if (!fs.existsSync(userAssetDir)) {
      fs.mkdirSync(userAssetDir, { recursive: true });
    }

    const fileExt = output.mimeType.includes('jpeg') || output.mimeType.includes('jpg') ? 'jpg' : 'png';
    const genId = `gen_${crypto.randomUUID()}`;
    const filename = `${genId}.${fileExt}`;
    const filePath = path.join(userAssetDir, filename);

    const buffer = Buffer.from(output.imageBase64, 'base64');
    fs.writeFileSync(filePath, buffer);

    const assetUrl = `/api/generations/asset/${userId}/${filename}`;

    return {
      id: genId,
      status: 'COMPLETED',
      assetUrl,
      mimeType: output.mimeType,
      provider: output.provider,
      model: output.model,
      sizeBytes: buffer.length,
      prompt: output.prompt,
      imageBase64: `data:${output.mimeType};base64,${output.imageBase64}`
    };
  }

  public async generateVideo(options: any, userId: string): Promise<StoredGenerationResult> {
    throw new Error('Video generation requires enterprise video GPU capacity. Feature in preview.');
  }

  public async generateChat(options: ChatGenerationOptions): Promise<ChatGenerationOutput> {
    return this.chatProvider.generateChat(options);
  }
}

export const aiService = new AIService();
