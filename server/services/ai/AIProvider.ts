export interface ImageGenerationOptions {
  tool?: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string; // '1:1', '3:4', '4:3', '9:16', '16:9'
  resolution?: string; // '1K', '2K', '4K'
  style?: string;
  sourceImageBase64?: string;
  sourceImageMimeType?: string;
  strength?: number;
  seed?: number;
}

export interface ImageGenerationOutput {
  status: 'COMPLETED' | 'FAILED';
  provider: string;
  model: string;
  mimeType: string;
  imageBase64: string;
  width?: number;
  height?: number;
  seed?: number;
  prompt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatGenerationOptions {
  conversationId?: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
}

export interface ChatGenerationOutput {
  message: ChatMessage;
  model: string;
  provider: string;
}

export interface ImageProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationOutput>;
}

export interface ChatProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  generateChat(options: ChatGenerationOptions): Promise<ChatGenerationOutput>;
}
