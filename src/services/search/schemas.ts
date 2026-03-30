import { z } from 'zod';

/** Body for POST /api/v1/search. */
export const searchBodySchema = z.object({
  filters: z
    .object({
      keyword: z.string().optional(),
      boatType: z.string().optional(),
      make: z.string().optional(),
      model: z.string().optional(),
      yearMin: z.number().int().optional(),
      yearMax: z.number().int().optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      country: z.string().optional(),
      region: z.string().optional(),
      lengthMinFt: z.number().optional(),
      lengthMaxFt: z.number().optional(),
      hullMaterial: z.string().optional(),
      fuelType: z.string().optional(),
      hasPhotos: z.boolean().optional(),
      conditionScoreMin: z.number().int().min(1).max(10).optional(),
    })
    .default({}),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/** Body for POST /api/v1/search/semantic. */
export const semanticSearchBodySchema = searchBodySchema.extend({
  /** The natural-language query to embed for semantic search. */
  query: z.string().min(1).max(500),
});
