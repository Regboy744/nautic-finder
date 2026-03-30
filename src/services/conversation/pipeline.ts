/**
 * Conversation pipeline — the 8-step AI chat orchestration.
 *
 * Pipeline steps:
 * 1. Topic Guard — reject off-topic messages (no AI cost)
 * 2. Filter Extraction — NL → structured filters via Gemini Flash
 * 3. SQL Pre-filter — narrow down listings with Drizzle WHERE
 * 4. Embedding — generate query vector via OpenAI
 * 5. Vector Search — pgvector cosine similarity on pre-filtered set
 * 6. Result Scoring — weighted ranking
 * 7. AI Reasoning — Claude generates expert response with boat context
 * 8. Store & Return — append messages to conversation, return response
 *
 * Each step has timing, error handling, and graceful degradation.
 * Target: <4 seconds total.
 */

import type { Logger } from 'pino';
import { checkTopic, getOffTopicResponse } from '../ai/topic-guard.js';
import type { FilterExtractor } from '../ai/filter-extractor.js';
import type { OpenAiProvider } from '../ai/providers/openai.provider.js';
import type { ReasoningEngine } from '../ai/reasoning-engine.js';
import type { TokenBudget } from '../ai/token-budget.js';
import type { SearchService } from '../search/search.service.js';
import type { ChatMessage, ExtractedFilters } from '../ai/types.js';

/** Input for the conversation pipeline. */
export interface PipelineInput {
  /** The user's message. */
  message: string;
  /** Previous conversation history for context. */
  history: ChatMessage[];
}

/** Full pipeline result. */
export interface PipelineResult {
  /** The AI's response text. */
  response: string;
  /** Whether the message was off-topic. */
  isOffTopic: boolean;
  /** Extracted search filters (if any). */
  filters: ExtractedFilters | null;
  /** IDs of boats referenced in the response. */
  boatsReferenced: string[];
  /** Timing breakdown for each step. */
  timing: {
    total: number;
    topicGuard: number;
    filterExtraction: number;
    embedding: number;
    search: number;
    reasoning: number;
  };
}

/** Dependencies for the pipeline. */
export interface PipelineDeps {
  filterExtractor: FilterExtractor | null;
  openAi: OpenAiProvider | null;
  reasoningEngine: ReasoningEngine | null;
  searchService: SearchService | null;
  tokenBudget: TokenBudget | null;
  log: Logger;
}

/**
 * Creates the conversation pipeline.
 */
export function createPipeline(deps: PipelineDeps) {
  const { filterExtractor, openAi, reasoningEngine, searchService, tokenBudget, log } = deps;

  return {
    /**
     * Runs the full 8-step pipeline for a user message.
     */
    async process(input: PipelineInput): Promise<PipelineResult> {
      const totalStart = Date.now();
      const timing = {
        total: 0,
        topicGuard: 0,
        filterExtraction: 0,
        embedding: 0,
        search: 0,
        reasoning: 0,
      };

      // Step 1: Topic Guard
      const topicStart = Date.now();
      const topicResult = checkTopic(input.message);
      timing.topicGuard = Date.now() - topicStart;

      if (!topicResult.isOnTopic) {
        timing.total = Date.now() - totalStart;
        return {
          response: getOffTopicResponse(),
          isOffTopic: true,
          filters: null,
          boatsReferenced: [],
          timing,
        };
      }

      // Check budget before proceeding with AI calls
      if (tokenBudget) {
        const { allowed, reason } = tokenBudget.canSpend();
        if (!allowed) {
          log.warn({ reason }, 'Token budget exhausted');
          timing.total = Date.now() - totalStart;
          return {
            response:
              "I'm temporarily unavailable due to high demand. Please try again in a few minutes.",
            isOffTopic: false,
            filters: null,
            boatsReferenced: [],
            timing,
          };
        }
      }

      // Step 2: Filter Extraction (graceful degradation)
      let filters: ExtractedFilters | null = null;
      const filterStart = Date.now();
      if (filterExtractor) {
        try {
          filters = await filterExtractor.extract(input.message);
        } catch (err) {
          log.warn({ err }, 'Filter extraction failed, continuing without filters');
        }
      }
      timing.filterExtraction = Date.now() - filterStart;

      // Step 3-5: Search (embedding + vector search + scoring)
      let boatContext = '';
      let boatsReferenced: string[] = [];
      const searchStart = Date.now();

      if (searchService && filters) {
        try {
          // Generate embedding if OpenAI is available
          let embedding: number[] | undefined;
          const embeddingStart = Date.now();
          if (openAi) {
            try {
              const embResult = await openAi.generateEmbedding(input.message);
              embedding = embResult.embedding;
              if (tokenBudget) tokenBudget.record('openai', embResult.tokensUsed, 0);
            } catch (err) {
              log.warn({ err }, 'Embedding generation failed, continuing without vector search');
            }
          }
          timing.embedding = Date.now() - embeddingStart;

          // Run search
          const searchResult = await searchService.search({
            filters,
            embedding,
            page: 1,
            limit: 10,
          });

          if (searchResult.data.length > 0) {
            boatsReferenced = searchResult.data.map((r) => r.listing.id);
            boatContext = searchResult.data
              .slice(0, 5) // Top 5 for context
              .map((r, i) => {
                const l = r.listing;
                return `${i + 1}. ${l.year ?? ''} ${l.make ?? ''} ${l.modelName ?? ''} — ${l.currency ?? ''} ${l.price ?? 'N/A'}, ${l.lengthFt ?? '?'}ft, ${l.country ?? 'Unknown'} (Score: ${r.score})`;
              })
              .join('\n');
          }
        } catch (err) {
          log.warn({ err }, 'Search failed, continuing without boat results');
        }
      }
      timing.search = Date.now() - searchStart - timing.embedding;

      // Step 7: AI Reasoning
      let response: string;
      const reasonStart = Date.now();

      if (reasoningEngine) {
        try {
          const result = await reasoningEngine.reason({
            message: input.message,
            history: input.history,
            boatContext: boatContext || undefined,
          });
          response = result.text;
          if (tokenBudget) {
            tokenBudget.record('claude', result.tokensUsed.input, result.tokensUsed.output);
          }
        } catch (err) {
          log.error({ err }, 'Reasoning failed');
          response =
            "I'm having trouble generating a response right now. Please try again in a moment.";
        }
      } else {
        // No reasoning engine available — provide a basic response
        response = filters
          ? `I found some matching boats based on your search. Here are the filters I extracted: ${JSON.stringify(filters)}`
          : "I understand you're looking for a boat. Could you tell me more about what you need — type, size, budget, and where you'll be sailing?";
      }
      timing.reasoning = Date.now() - reasonStart;

      timing.total = Date.now() - totalStart;

      log.info(
        { timing, filtersExtracted: !!filters, boatsFound: boatsReferenced.length },
        'Pipeline completed',
      );

      return {
        response,
        isOffTopic: false,
        filters,
        boatsReferenced,
        timing,
      };
    },
  };
}

export type Pipeline = ReturnType<typeof createPipeline>;
