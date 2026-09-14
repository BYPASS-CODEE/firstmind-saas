import { GoogleGenAI } from '@google/genai';
import { ChatProvider, ChatGenerationOptions, ChatGenerationOutput, ChatMessage } from './AIProvider';

export class GeminiChatProvider implements ChatProvider {
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

  public async generateChat(options: ChatGenerationOptions): Promise<ChatGenerationOutput> {
    const ai = this.getClient();
    if (!ai) {
      const error: any = new Error('Gemini API key is not configured on the server.');
      error.code = 'MISSING_API_KEY';
      throw error;
    }

    const modelName = process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash';

    const systemInstruction = options.systemInstruction || 
      `You are the FirstMind AI Creative Assistant. You assist designers, artists, and creators with formulating prompt concepts, exploring visual aesthetics, lighting techniques, camera angles, color grading, and artistic direction. When proposing prompt ideas for image generation, format clear, highly descriptive prompts that users can immediately use. Keep answers concise, creative, and inspiring.`;

    // Map conversation messages into Gemini contents format
    // Filter out empty messages and system messages (which go to systemInstruction)
    const validMessages = options.messages.filter(m => m.role === 'user' || m.role === 'assistant');
    if (validMessages.length === 0) {
      const error: any = new Error('No valid messages provided in the chat request.');
      error.code = 'INVALID_REQUEST';
      throw error;
    }

    const contents = validMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: options.temperature !== undefined ? options.temperature : 0.7
        }
      });

      const responseText = response.text || 'I could not formulate a response at this time.';

      const outputMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      };

      return {
        message: outputMessage,
        model: modelName,
        provider: this.providerName
      };
    } catch (err: any) {
      const errStr = err?.message || String(err);
      let parsedMsg = errStr;

      try {
        const parsed = JSON.parse(errStr);
        if (parsed?.error?.message) {
          parsedMsg = parsed.error.message;
        }
      } catch {}

      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        const error: any = new Error('Gemini API quota has been reached. Please try again later.');
        error.code = 'QUOTA_EXCEEDED';
        throw error;
      }

      if (errStr.includes('SAFETY') || errStr.includes('blocked')) {
        const error: any = new Error('The provider could not generate a response due to safety policies.');
        error.code = 'SAFETY_REJECTION';
        throw error;
      }

      const error: any = new Error(parsedMsg || 'Could not communicate with the conversational AI provider.');
      error.code = 'CHAT_FAILED';
      throw error;
    }
  }
}
