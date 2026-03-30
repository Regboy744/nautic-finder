/**
 * Core types for the AI service.
 */

/** AI task types that determine which provider handles the request. */
export type AiTask =
  | 'filter-extraction'
  | 'embedding'
  | 'reasoning'
  | 'topic-guard'
  | 'image-analysis'
  | 'comparison';

/** AI provider identifiers. */
export type AiProvider = 'gemini' | 'claude' | 'openai';

/** Result from any AI text generation call. */
export interface AiTextResult {
  text: string;
  provider: AiProvider;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  durationMs: number;
}

/** Result from an embedding generation call. */
export interface AiEmbeddingResult {
  embedding: number[];
  provider: AiProvider;
  model: string;
  dimensions: number;
  tokensUsed: number;
  durationMs: number;
}

/** A message in a conversation history. */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Extracted search filters from natural language. */
export interface ExtractedFilters {
  boatType?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  country?: string;
  region?: string;
  lengthMinFt?: number;
  lengthMaxFt?: number;
  hullMaterial?: string;
  fuelType?: string;
  /** Keywords that don't map to structured filters. */
  keywords?: string;
}
