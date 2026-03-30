import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

/** Drizzle database instance type with full schema */
export type Database = ReturnType<typeof createDatabase>;

/** Options for creating the database connection */
export interface DatabaseOptions {
  url: string;
  maxConnections?: number;
  idleTimeout?: number;
}

/**
 * Creates a PostgreSQL connection and wraps it with Drizzle ORM.
 * Returns both the Drizzle instance and a disconnect function for graceful shutdown.
 */
export function createDatabase(options: DatabaseOptions): {
  db: ReturnType<typeof drizzle<typeof schema>>;
  sql: postgres.Sql;
  disconnect: () => Promise<void>;
} {
  const connection = postgres(options.url, {
    max: options.maxConnections ?? 10,
    idle_timeout: options.idleTimeout ?? 20,
    connect_timeout: 10,
  });

  const db = drizzle(connection, { schema });

  return {
    db,
    sql: connection,
    disconnect: async () => {
      await connection.end();
    },
  };
}

/**
 * Performs a basic health check on the database connection.
 * Returns true if the database responds to a simple query.
 */
export async function checkDatabaseHealth(connection: postgres.Sql): Promise<boolean> {
  try {
    await connection`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
