import { z } from 'zod';

/** Body for POST /api/v1/ai/extract-filters. */
export const extractFiltersBodySchema = z.object({
  query: z.string().min(1).max(500),
});

/** Body for POST /api/v1/ai/generate-embedding. */
export const generateEmbeddingBodySchema = z.object({
  text: z.string().min(1).max(5000),
});

/** Body for POST /api/v1/ai/reason. */
export const reasonBodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      }),
    )
    .default([]),
  boatContext: z.string().optional(),
});
