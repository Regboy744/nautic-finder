import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { createDatabase, checkDatabaseHealth } from '../../../src/shared/db/client.js';
import type { Database } from '../../../src/shared/db/client.js';
import postgres from 'postgres';

/**
 * Integration tests for database connection.
 * Requires DATABASE_URL to be set (uses Supabase or local Docker Postgres).
 * Skipped if DATABASE_URL is not available.
 */
const DATABASE_URL = process.env.DATABASE_URL;

const describeWithDb = DATABASE_URL ? describe : describe.skip;

describeWithDb('Database connection', () => {
  let db: Database['db'];
  let sql: postgres.Sql;
  let disconnect: () => Promise<void>;

  beforeAll(() => {
    const result = createDatabase({ url: DATABASE_URL! });
    db = result.db;
    sql = result.sql;
    disconnect = result.disconnect;
  });

  afterAll(async () => {
    if (disconnect) {
      await disconnect();
    }
  });

  it('connects to PostgreSQL and runs a simple query', async () => {
    const result = await sql`SELECT 1 as value`;
    expect(result[0].value).toBe(1);
  });

  it('health check returns true for active connection', async () => {
    const healthy = await checkDatabaseHealth(sql);
    expect(healthy).toBe(true);
  });

  it('drizzle instance is created and usable', () => {
    expect(db).toBeDefined();
    // Drizzle wraps the connection; verify it has query capabilities
    expect(db.query).toBeDefined();
  });
});
