import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createServiceLogger } from '../../shared/logger/index.js';
import { createGeminiProvider } from './providers/gemini.provider.js';
import { createClaudeProvider } from './providers/claude.provider.js';
import { createOpenAiProvider } from './providers/openai.provider.js';
import { createFilterExtractor } from './filter-extractor.js';
import { createReasoningEngine } from './reasoning-engine.js';
import { createTokenBudget } from './token-budget.js';
import aiRoutes from './routes.js';

/** AI service plugin options. */
export interface AiPluginOptions {
  geminiApiKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

/**
 * AI service plugin — assembles providers, extractors, reasoning, and routes.
 */
async function aiPlugin(server: FastifyInstance, opts: AiPluginOptions): Promise<void> {
  const log = createServiceLogger('ai');

  // Build providers
  const gemini = createGeminiProvider({ apiKey: opts.geminiApiKey }, log);
  const claude = createClaudeProvider({ apiKey: opts.anthropicApiKey }, log);
  const openAi = createOpenAiProvider({ apiKey: opts.openaiApiKey }, log);

  // Build services
  const filterExtractor = createFilterExtractor(gemini, log);
  const reasoningEngine = createReasoningEngine(claude, log);
  const tokenBudget = createTokenBudget();

  // Register routes
  await server.register(aiRoutes, {
    filterExtractor,
    reasoningEngine,
    openAi,
    tokenBudget,
  });

  log.info('AI service registered');
}

export default fp(aiPlugin, {
  name: 'ai',
  fastify: '5.x',
});
