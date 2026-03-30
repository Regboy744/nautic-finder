/**
 * Reasoning engine — generates AI responses about boats using Claude.
 * Takes search results + conversation history → produces expert recommendations.
 */

import type { Logger } from 'pino';
import type { ClaudeProvider } from './providers/claude.provider.js';
import type { AiTextResult, ChatMessage } from './types.js';
import { buildSystemPrompt } from './system-prompt.js';

/** Input for the reasoning engine. */
export interface ReasoningInput {
  /** Current user message. */
  message: string;
  /** Previous conversation messages (for context). */
  history?: ChatMessage[];
  /** Formatted boat data to include in the system prompt. */
  boatContext?: string;
}

/**
 * Creates a reasoning engine powered by Claude.
 */
export function createReasoningEngine(claude: ClaudeProvider, log: Logger) {
  return {
    /**
     * Generates an expert response about boats.
     */
    async reason(input: ReasoningInput): Promise<AiTextResult> {
      const systemPrompt = buildSystemPrompt(input.boatContext);

      // Build message history
      const messages: ChatMessage[] = [
        ...(input.history ?? []),
        { role: 'user', content: input.message },
      ];

      const result = await claude.generateText(messages, {
        systemPrompt,
        temperature: 0.7,
      });

      log.info(
        {
          durationMs: result.durationMs,
          tokensUsed: result.tokensUsed.total,
          historyLength: input.history?.length ?? 0,
          hasBoatContext: !!input.boatContext,
        },
        'Reasoning completed',
      );

      return result;
    },
  };
}

export type ReasoningEngine = ReturnType<typeof createReasoningEngine>;
