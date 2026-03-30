/**
 * Anthropic Claude AI provider wrapper.
 * Used for: complex reasoning, boat recommendations, comparison.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';
import type { AiTextResult, ChatMessage } from '../types.js';
import { ExternalServiceError } from '../../../shared/errors/index.js';

/** Claude provider configuration. */
export interface ClaudeProviderConfig {
  apiKey: string;
  /** Model to use. Default: 'claude-sonnet-4-20250514'. */
  model?: string;
  maxRetries?: number;
  /** Max output tokens. Default: 2048. */
  maxTokens?: number;
}

/**
 * Creates a Claude AI provider.
 */
export function createClaudeProvider(config: ClaudeProviderConfig, log: Logger) {
  const client = new Anthropic({ apiKey: config.apiKey });
  const modelName = config.model ?? 'claude-sonnet-4-20250514';
  const maxRetries = config.maxRetries ?? 2;
  const maxTokens = config.maxTokens ?? 2048;

  return {
    provider: 'claude' as const,
    model: modelName,

    /**
     * Generates text using Claude with conversation history support.
     */
    async generateText(
      messages: ChatMessage[],
      options?: { systemPrompt?: string; temperature?: number },
    ): Promise<AiTextResult> {
      const startMs = Date.now();

      // Separate system message from conversation messages
      const anthropicMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await client.messages.create({
            model: modelName,
            max_tokens: maxTokens,
            system: options?.systemPrompt,
            messages: anthropicMessages,
            temperature: options?.temperature ?? 0.7,
          });

          const text = response.content
            .filter((block) => block.type === 'text')
            .map((block) => {
              if (block.type === 'text') return block.text;
              return '';
            })
            .join('');

          return {
            text,
            provider: 'claude',
            model: modelName,
            tokensUsed: {
              input: response.usage.input_tokens,
              output: response.usage.output_tokens,
              total: response.usage.input_tokens + response.usage.output_tokens,
            },
            durationMs: Date.now() - startMs,
          };
        } catch (err) {
          if (attempt === maxRetries) {
            log.error({ err, attempt, model: modelName }, 'Claude generation failed');
            throw new ExternalServiceError('claude', 'Text generation failed', err);
          }
          const backoff = 1000 * Math.pow(2, attempt);
          log.warn({ err, attempt, backoff }, 'Claude retrying');
          await new Promise((r) => setTimeout(r, backoff));
        }
      }

      throw new ExternalServiceError('claude', 'Text generation failed after retries');
    },
  };
}

export type ClaudeProvider = ReturnType<typeof createClaudeProvider>;
