/**
 * Model router — maps AI tasks to the appropriate provider.
 *
 * Routing strategy:
 * - filter-extraction → Gemini Flash (fast, free tier)
 * - topic-guard → Gemini Flash (fast, cheap)
 * - embedding → OpenAI (text-embedding-3-small)
 * - reasoning → Claude Sonnet (best quality for complex analysis)
 * - comparison → Claude Sonnet
 * - image-analysis → Gemini Flash (vision capable)
 */

import type { AiTask, AiProvider } from './types.js';

/** Task-to-provider mapping. */
const TASK_ROUTING: Record<AiTask, AiProvider> = {
  'filter-extraction': 'gemini',
  'topic-guard': 'gemini',
  embedding: 'openai',
  reasoning: 'claude',
  comparison: 'claude',
  'image-analysis': 'gemini',
};

/**
 * Returns the provider that should handle a given AI task.
 */
export function routeTask(task: AiTask): AiProvider {
  return TASK_ROUTING[task];
}

/**
 * Returns all available task routings for debugging/logging.
 */
export function getRoutingTable(): Record<AiTask, AiProvider> {
  return { ...TASK_ROUTING };
}
