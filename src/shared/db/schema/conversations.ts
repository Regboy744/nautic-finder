import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * Conversations table — chat sessions between user and AI.
 * Messages stored as JSONB array for flexible schema.
 */
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title'),
  messages: jsonb('messages')
    .$type<
      Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
        boatsReferenced?: string[];
      }>
    >()
    .default([])
    .notNull(),
  searchContext: jsonb('search_context').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
