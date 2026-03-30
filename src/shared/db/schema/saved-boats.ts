import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { boatListings } from './boat-listings.js';

/**
 * Saved boats table — user's watchlist of tracked listings.
 * Unique constraint prevents saving the same listing twice.
 */
export const savedBoats = pgTable(
  'saved_boats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    listingId: uuid('listing_id')
      .references(() => boatListings.id, { onDelete: 'cascade' })
      .notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('saved_boats_user_listing_idx').on(table.userId, table.listingId)],
);
