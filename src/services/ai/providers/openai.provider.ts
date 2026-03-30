/**
 * OpenAI provider wrapper.
 * Used for: embedding generation (text-embedding-3-small).
 */

import OpenAI from 'openai';
import type { Logger } from 'pino';
import type { AiEmbeddingResult } from '../types.js';
import { ExternalServiceError } from '../../../shared/errors/index.js';
import { EMBEDDING_DIMENSIONS } from '../../../shared/constants/index.js';

/** OpenAI provider configuration. */
export interface OpenAiProviderConfig {
  apiKey: string;
  /** Embedding model. Default: 'text-embedding-3-small'. */
  embeddingModel?: string;
  maxRetries?: number;
}

/**
 * Creates an OpenAI provider (primarily for embeddings).
 */
export function createOpenAiProvider(config: OpenAiProviderConfig, log: Logger) {
  const client = new OpenAI({ apiKey: config.apiKey });
  const embeddingModel = config.embeddingModel ?? 'text-embedding-3-small';
  const maxRetries = config.maxRetries ?? 2;

  return {
    provider: 'openai' as const,
    embeddingModel,

    /**
     * Generates an embedding vector from text.
     */
    async generateEmbedding(text: string): Promise<AiEmbeddingResult> {
      const startMs = Date.now();

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await client.embeddings.create({
            model: embeddingModel,
            input: text,
            dimensions: EMBEDDING_DIMENSIONS,
          });

          const embedding = response.data[0].embedding;

          return {
            embedding,
            provider: 'openai',
            model: embeddingModel,
            dimensions: embedding.length,
            tokensUsed: response.usage?.total_tokens ?? 0,
            durationMs: Date.now() - startMs,
          };
        } catch (err) {
          if (attempt === maxRetries) {
            log.error({ err, attempt, model: embeddingModel }, 'OpenAI embedding failed');
            throw new ExternalServiceError('openai', 'Embedding generation failed', err);
          }
          const backoff = 1000 * Math.pow(2, attempt);
          log.warn({ err, attempt, backoff }, 'OpenAI retrying');
          await new Promise((r) => setTimeout(r, backoff));
        }
      }

      throw new ExternalServiceError('openai', 'Embedding generation failed after retries');
    },
  };
}

export type OpenAiProvider = ReturnType<typeof createOpenAiProvider>;
