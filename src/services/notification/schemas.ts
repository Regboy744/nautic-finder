import { z } from 'zod';

export const matchListingBodySchema = z.object({
  listingId: z.string().uuid(),
  isNew: z.boolean().default(true),
  isPriceChange: z.boolean().default(false),
});
