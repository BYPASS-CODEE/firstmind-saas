# FIRSTMIND — Production-Grade AI Creative SaaS Platform

FirstMind is a full-stack AI generative studio and creative platform built with React, TypeScript, Express, and Vite. It provides an extensible provider architecture currently powered by Google's official Gemini API (`@google/genai`) for real image generation and conversational AI.

---

## Key Features

1. **Modular AI Provider Architecture**:
   - `AIProvider` interface defining standard contracts for image and conversational intelligence.
   - `GeminiImageProvider`: Real server-side image generation with model `gemini-2.5-flash-image`.
   - `GeminiChatProvider`: Real server-side conversational assistant with model `gemini-3.8-flash`.
   - Easily swap or augment with future providers (e.g., Flux, OpenAI, Replicate, or self-hosted GPU endpoints) without rewriting frontend interfaces.

2. **Zero Client Secret Exposure**:
   - `GEMINI_API_KEY` is kept strictly server-side inside Node.js execution contexts.
   - No frontend code, client bundles, or network payloads ever contain API keys or raw credentials.

3. **Development AI Test Mode (`DEV_AI_TEST_MODE=true`)**:
   - Allows creators and engineers to test real Gemini image generation and conversational flows immediately.
   - **Login Page Entry**: The application opens directly on the Login/Registration experience.
   - A dedicated **"AI Test Mode — Development"** entry button allows continuing to the AI Studio without requiring credit purchases, payment setup, fake subscriptions, or mock billing.
   - **Fail-Safe for Production**: If `NODE_ENV === 'production'` or `DEV_AI_TEST_MODE=false`, the test bypass is strictly deactivated and will fail-safe to authenticated session authorization.

4. **Integrated Image & Chat Workflow**:
   - **FirstMind AI Chat Assistant** (`/app/chat`): Brainstorm concepts, craft detailed visual aesthetics, and refine prompts.
   - **"Create image from this prompt"**: One-click prompt transfer directly to the Image Generation Studio for user review before generating. No silent or unconfirmed credit expenditure.

5. **Supported Aspect Ratios**:
   - Native Gemini-supported aspect ratios: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`.
   - Multi-resolution scaling presets (`Standard`, `High`, `Ultra`).

---

## Environment Configuration

Copy or inspect `.env.example` to configure runtime parameters:

```env
# Server-side Gemini API credentials
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
GEMINI_CHAT_MODEL=gemini-3.8-flash

# Development AI Test Mode (set to false in production)
DEV_AI_TEST_MODE=true

# Application URL
APP_URL=http://localhost:3000

# Security & Storage
SESSION_SECRET=your_session_secret
AI_PROVIDER_DEFAULT=gemini
STORAGE_DRIVER=local
```

> **Security Note**: Never prefix `GEMINI_API_KEY` with `VITE_` or commit actual secrets to source control.

---

## Installation & Running

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 3. Build for production
```bash
npm run build
npm run start
```

---

## Switching AI Providers in the Future

The AI architecture is structured in `server/services/ai/`:

- `AIProvider.ts`: Declares `ImageProvider` and `ChatProvider` interfaces.
- `GeminiImageProvider.ts`: Implementation for Google Gemini image generation.
- `GeminiChatProvider.ts`: Implementation for Google Gemini text/chat generation.
- `AIService.ts`: Provider registry and dispatch coordinator.

To add a new provider (e.g., `FluxImageProvider` or `OpenAIChatProvider`):
1. Create a class implementing `ImageProvider` or `ChatProvider`.
2. Register it in `AIService` constructor based on configuration or runtime flag.
3. The rest of the FirstMind backend and frontend UI remains untouched.

---

## Testing & Verification

- **Linting**: `npm run lint` (`tsc --noEmit`)
- **App Build**: `npm run build`
- **Health Check**: `GET /api/health`
- **Runtime Configuration Check**: `GET /api/config`
