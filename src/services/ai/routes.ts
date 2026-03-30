import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { z } from 'zod';
import { validate } from '../../gateway/middleware/validate.js';
import {
  extractFiltersBodySchema,
  generateEmbeddingBodySchema,
  reasonBodySchema,
} from './schemas.js';
import type { FilterExtractor } from './filter-extractor.js';
import type { ReasoningEngine } from './reasoning-engine.js';
import type { OpenAiProvider } from './providers/openai.provider.js';
import type { TokenBudget } from './token-budget.js';
import { checkTopic, getOffTopicResponse } from './topic-guard.js';
import { RateLimitError } from '../../shared/errors/index.js';

/** AI routes plugin options. */
export interface AiRoutesOptions {
  filterExtractor: FilterExtractor;
  reasoningEngine: ReasoningEngine;
  openAi: OpenAiProvider;
  tokenBudget: TokenBudget;
}

/**
 * AI routes plugin — registers /api/v1/ai endpoints.
 */
function aiRoutes(server: FastifyInstance, opts: AiRoutesOptions): void {
  const { filterExtractor, reasoningEngine, openAi, tokenBudget } = opts;

  /**
   * POST /api/v1/ai/extract-filters — parse NL query into structured filters.
   */
  server.post(
    '/api/v1/ai/extract-filters',
    {
      preHandler: validate({ body: extractFiltersBodySchema }),
      schema: { tags: ['AI'], description: 'Extract search filters from natural language' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { allowed, reason } = tokenBudget.canSpend();
      if (!allowed) throw new RateLimitError(reason);

      const { query } = request.body as z.infer<typeof extractFiltersBodySchema>;
      const filters = await filterExtractor.extract(query);

      return { success: true, data: { filters, query } };
    },
  );

  /**
   * POST /api/v1/ai/generate-embedding — generate a vector embedding.
   */
  server.post(
    '/api/v1/ai/generate-embedding',
    {
      preHandler: validate({ body: generateEmbeddingBodySchema }),
      schema: { tags: ['AI'], description: 'Generate embedding vector from text' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { allowed, reason } = tokenBudget.canSpend();
      if (!allowed) throw new RateLimitError(reason);

      const { text } = request.body as z.infer<typeof generateEmbeddingBodySchema>;
      const result = await openAi.generateEmbedding(text);

      tokenBudget.record('openai', result.tokensUsed, 0);

      return {
        success: true,
        data: {
          embedding: result.embedding,
          dimensions: result.dimensions,
          model: result.model,
          durationMs: result.durationMs,
        },
      };
    },
  );

  /**
   * POST /api/v1/ai/reason — generate an expert AI response about boats.
   * Includes topic guard check.
   */
  server.post(
    '/api/v1/ai/reason',
    {
      preHandler: validate({ body: reasonBodySchema }),
      schema: { tags: ['AI'], description: 'Generate expert boat recommendation' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const body = request.body as z.infer<typeof reasonBodySchema>;

      // Topic guard — reject off-topic messages without AI cost
      const topicCheck = checkTopic(body.message);
      if (!topicCheck.isOnTopic) {
        return {
          success: true,
          data: {
            response: getOffTopicResponse(),
            isOffTopic: true,
            topicCheck,
          },
        };
      }

      const { allowed, reason } = tokenBudget.canSpend();
      if (!allowed) throw new RateLimitError(reason);

      const result = await reasoningEngine.reason({
        message: body.message,
        history: body.history,
        boatContext: body.boatContext,
      });

      tokenBudget.record('claude', result.tokensUsed.input, result.tokensUsed.output);

      return {
        success: true,
        data: {
          response: result.text,
          isOffTopic: false,
          topicCheck,
          model: result.model,
          tokensUsed: result.tokensUsed,
          durationMs: result.durationMs,
        },
      };
    },
  );

  /**
   * GET /api/v1/ai/budget — current token usage stats.
   */
  server.get(
    '/api/v1/ai/budget',
    { schema: { tags: ['AI'], description: 'Get AI token budget stats' } },
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      return { success: true, data: tokenBudget.getStats() };
    },
  );
}

export default fp(aiRoutes, {
  name: 'ai-routes',
  fastify: '5.x',
});
