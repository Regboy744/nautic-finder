import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Database } from '../../shared/db/client.js';
import { createServiceLogger } from '../../shared/logger/index.js';
import { createSearchService } from './search.service.js';
import { createSearchCache } from './search-cache.js';
import searchRoutes from './routes.js';

/** Options for the search plugin. */
export interface SearchPluginOptions {
  db: Database['db'];
  /** Redis client for search caching. Null = no caching. */
  redis: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, expiryMode: string, ttl: number): Promise<unknown>;
    del(key: string): Promise<number>;
  } | null;
}

/**
 * Search service plugin — assembles cache, service, and routes.
 */
async function searchPlugin(server: FastifyInstance, opts: SearchPluginOptions): Promise<void> {
  const log = createServiceLogger('search');

  // Build search cache (null if no Redis)
  const cache = opts.redis ? createSearchCache(opts.redis) : null;

  // Build search service
  const searchService = createSearchService({
    db: opts.db,
    cache,
    log,
  });

  // Register routes
  await server.register(searchRoutes, { searchService });

  log.info('Search service registered');
}

export default fp(searchPlugin, {
  name: 'search',
  fastify: '5.x',
});
