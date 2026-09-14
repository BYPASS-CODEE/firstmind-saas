import { GoogleGenAI } from '@google/genai';
import { ImageProvider, ImageGenerationOptions, ImageGenerationOutput } from './AIProvider';

export class GeminiImageProvider implements ImageProvider {
  public readonly providerName = 'gemini';

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  public isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  public async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationOutput> {
    const ai = this.getClient();
    if (!ai) {
      const error: any = new Error('Gemini API key is not configured on the server.');
      error.code = 'MISSING_API_KEY';
      throw error;
    }

    const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

    // Validate prompt
    if (!options.prompt || !options.prompt.trim()) {
      const error: any = new Error('A valid text prompt is required to generate an image.');
      error.code = 'INVALID_REQUEST';
      throw error;
    }

    // Supported aspect ratios in Gemini
    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '3:2', '4:5', '5:4'];
    const selectedRatio = options.aspectRatio && validRatios.includes(options.aspectRatio) 
      ? options.aspectRatio 
      : '1:1';

    let promptText = options.prompt.trim();
    if (options.negativePrompt && options.negativePrompt.trim()) {
      promptText += ` (Avoid: ${options.negativePrompt.trim()})`;
    }
    if (options.style && options.style !== 'Default' && options.style !== 'None') {
      promptText += `, in the aesthetic style of ${options.style}`;
    }

    const parts: any[] = [];

    // Image-to-Image / reference image support
    if (options.sourceImageBase64) {
      const rawBase64 = options.sourceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const mime = options.sourceImageMimeType || 'image/png';
      parts.push({
        inlineData: {
          data: rawBase64,
          mimeType: mime
        }
      });
    }

    parts.push({ text: promptText });

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio
          }
        }
      });

      let imageBase64: string | null = null;
      let mimeType = 'image/png';

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageBase64 = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }
      }

      if (!imageBase64) {
        const textFallback = response.text || 'The model did not return image data.';
        const error: any = new Error(`The image provider did not return an image: ${textFallback}`);
        error.code = 'IMAGE_NOT_RETURNED';
        throw error;
      }

      return {
        status: 'COMPLETED',
        provider: this.providerName,
        model: modelName,
        mimeType,
        imageBase64,
        prompt: options.prompt
      };
    } catch (err: any) {
      // Analyze error and format safe structured response
      const errStr = err?.message || String(err);
      let parsedMsg = errStr;
      let code = err?.code || 'GENERATION_FAILED';

      try {
        const parsed = JSON.parse(errStr);
        if (parsed?.error?.message) {
          parsedMsg = parsed.error.message;
        }
        if (parsed?.error?.status === 'RESOURCE_EXHAUSTED' || parsed?.error?.code === 429) {
          code = 'QUOTA_EXCEEDED';
        }
      } catch {}

      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('Quota exceeded')) {
        const error: any = new Error('Gemini API quota has been reached. Please try again later.');
        error.code = 'QUOTA_EXCEEDED';
        error.originalDetails = parsedMsg;
        throw error;
      }

      if (errStr.includes('SAFETY') || errStr.includes('blocked') || errStr.includes('safety')) {
        const error: any = new Error('The provider could not generate this request due to safety guidelines.');
        error.code = 'SAFETY_REJECTION';
        throw error;
      }

      if (errStr.includes('400') || errStr.includes('INVALID_ARGUMENT')) {
        const error: any = new Error('The image request was rejected by the provider: ' + parsedMsg);
        error.code = 'INVALID_API_REQUEST';
        throw error;
      }

      if (errStr.includes('ETIMEDOUT') || errStr.includes('timeout')) {
        const error: any = new Error('The generation took too long. Please try again.');
        error.code = 'TIMEOUT';
        throw error;
      }

      if (errStr.includes('fetch failed') || errStr.includes('ECONNREFUSED')) {
        const error: any = new Error('Could not connect to the AI provider.');
        error.code = 'NETWORK_ERROR';
        throw error;
      }

      const error: any = new Error(parsedMsg || 'Something went wrong while generating the image.');
      error.code = code;
      throw error;
    }
  }
}
