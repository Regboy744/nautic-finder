/**
 * Google Gemini AI provider wrapper.
 * Used for: filter extraction (Gemini Flash — fast + free tier), topic guard.
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { Logger } from 'pino';
import type { AiTextResult } from '../types.js';
import { ExternalServiceError } from '../../../shared/errors/index.js';

/** Gemini provider configuration. */
export interface GeminiProviderConfig {
  apiKey: string;
  /** Model to use. Default: 'gemini-2.0-flash'. */
  model?: string;
  /** Max retries on failure. Default: 2. */
  maxRetries?: number;
}

/**
 * Creates a Gemini AI provider.
 */
export function createGeminiProvider(config: GeminiProviderConfig, log: Logger) {
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const modelName = config.model ?? 'gemini-2.0-flash';
  const maxRetries = config.maxRetries ?? 2;

  /**
   * Gets the generative model instance.
   */
  function getModel(systemInstruction?: string): GenerativeModel {
    return genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });
  }

  return {
    provider: 'gemini' as const,
    model: modelName,

    /**
     * Generates text from a prompt with optional system instruction.
     */
    async generateText(
      prompt: string,
      options?: { systemInstruction?: string; temperature?: number },
    ): Promise<AiTextResult> {
      const startMs = Date.now();

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const model = getModel(options?.systemInstruction);
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: options?.temperature ?? 0.3,
            },
          });

          const response = result.response;
          const text = response.text();
          const usage = response.usageMetadata;

          return {
            text,
            provider: 'gemini',
            model: modelName,
            tokensUsed: {
              input: usage?.promptTokenCount ?? 0,
              output: usage?.candidatesTokenCount ?? 0,
              total: usage?.totalTokenCount ?? 0,
            },
            durationMs: Date.now() - startMs,
          };
        } catch (err) {
          if (attempt === maxRetries) {
            log.error({ err, attempt, model: modelName }, 'Gemini generation failed');
            throw new ExternalServiceError('gemini', 'Text generation failed', err);
          }
          const backoff = 1000 * Math.pow(2, attempt);
          log.warn({ err, attempt, backoff }, 'Gemini retrying');
          await new Promise((r) => setTimeout(r, backoff));
        }
      }

      // Unreachable but satisfies TypeScript
      throw new ExternalServiceError('gemini', 'Text generation failed after retries');
    },
  };
}

export type GeminiProvider = ReturnType<typeof createGeminiProvider>;
