import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boatListings } from './boat-listings.js';

/**
 * Boat images analysis table — per-image AI condition analysis.
 * Each photo of a listing gets analyzed for condition issues.
 * Results stored so they're instant at query time (not recomputed).
 */
export const boatImagesAnalysis = pgTable('boat_images_analysis', {
  id: uuid('id').defaultRandom().primaryKey(),
  listingId: uuid('listing_id')
    .references(() => boatListings.id, { onDelete: 'cascade' })
    .notNull(),
  imageUrl: text('image_url').notNull(),
  imageOrder: integer('image_order').default(0).notNull(),
  analysis: text('analysis'),
  issuesFound: text('issues_found')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  areaAnalyzed: text('area_analyzed').$type<
    'hull' | 'deck' | 'interior' | 'engine' | 'sails' | 'other'
  >(),
  conditionScore: integer('condition_score'),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  aiModelUsed: text('ai_model_used'),
});
