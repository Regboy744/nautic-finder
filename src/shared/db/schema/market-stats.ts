import { pgTable, uuid, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Market stats table — aggregated pricing data per make/model/year range.
 * Used for price fairness assessment ("is this boat overpriced?").
 */
export const marketStats = pgTable('market_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  make: text('make').notNull(),
  modelName: text('model_name').notNull(),
  yearRange: text('year_range'),
  avgPriceEur: numeric('avg_price_eur'),
  avgPriceUsd: numeric('avg_price_usd'),
  medianPriceEur: numeric('median_price_eur'),
  medianPriceUsd: numeric('median_price_usd'),
  minPriceEur: numeric('min_price_eur'),
  maxPriceEur: numeric('max_price_eur'),
  minPriceUsd: numeric('min_price_usd'),
  maxPriceUsd: numeric('max_price_usd'),
  sampleCount: integer('sample_count').default(0).notNull(),
  lastCalculatedAt: timestamp('last_calculated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
