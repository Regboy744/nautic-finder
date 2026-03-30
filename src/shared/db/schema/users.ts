import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users table — platform user profiles.
 * The `id` matches the Supabase Auth user ID (set on registration, not auto-generated).
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Matches Supabase Auth user ID
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  experienceLevel: text('experience_level')
    .$type<'beginner' | 'intermediate' | 'expert'>()
    .default('beginner')
    .notNull(),
  preferences: jsonb('preferences').$type<Record<string, unknown>>(),
  notificationSettings: jsonb('notification_settings').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
