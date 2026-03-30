import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

/**
 * Brokers table — external websites being scraped.
 * Each row represents a broker/aggregator site like YachtWorld, Boat Trader, etc.
 */
export const brokers = pgTable('brokers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  website: text('website').notNull(),
  scraperType: text('scraper_type').notNull().$type<'playwright' | 'cheerio'>(),
  scraperConfig: jsonb('scraper_config').$type<Record<string, unknown>>(),
  scrapingSchedule: text('scraping_schedule'),
  lastScrapedAt: timestamp('last_scraped_at', { withTimezone: true }),
  totalListings: integer('total_listings').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
