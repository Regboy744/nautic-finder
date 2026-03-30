import { pgTable, uuid, text, jsonb, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { customVector } from './custom-types.js';

/**
 * Search alerts table — automated notification criteria.
 * When new listings match these filters/keywords, the user gets notified.
 */
export const searchAlerts = pgTable(
  'search_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    filters: jsonb('filters').$type<Record<string, unknown>>(),
    keywords: text('keywords'),
    keywordsEmbedding: customVector('keywords_embedding', { dimensions: 1536 }),
    frequency: text('frequency')
      .$type<'instant' | 'daily' | 'weekly'>()
      .default('daily')
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    lastNotifiedAt: timestamp('last_notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('search_alerts_user_active_idx').on(table.userId, table.isActive)],
);
