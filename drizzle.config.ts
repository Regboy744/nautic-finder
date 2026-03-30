import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/db/schema/index.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/nauticfinder',
  },
  verbose: true,
  strict: true,
});
