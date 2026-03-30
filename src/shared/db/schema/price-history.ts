import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { boatListings } from './boat-listings.js';

/**
 * Price history table — append-only log of every price change per listing.
 * Used for trend analysis, price drop alerts, and fairness assessment.
 */
export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id')
      .references(() => boatListings.id, { onDelete: 'cascade' })
      .notNull(),
    price: numeric('price').notNull(),
    currency: text('currency').notNull(),
    priceNormalizedEur: numeric('price_normalized_eur'),
    priceNormalizedUsd: numeric('price_normalized_usd'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('price_history_listing_recorded_idx').on(table.listingId, table.recordedAt)],
);
