/**
 * Search result cache backed by Redis.
 * Caches the top N scored result IDs for a given search query hash.
 * Supports pagination over cached results.
 */

import { createHash } from 'node:crypto';
import { REDIS_KEYS } from '../../shared/constants/index.js';

/** Redis client interface (subset of ioredis). */
interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expiryMode: string, ttl: number): Promise<unknown>;
  del(key: string): Promise<number>;
}

/** Cached search result entry. */
export interface CachedSearchEntry {
  ids: string[];
  totalCount: number;
  cachedAt: string;
}

/** Default cache TTL: 30 minutes. */
const DEFAULT_TTL_SECONDS = 30 * 60;

/**
 * Creates a search cache backed by Redis.
 */
export function createSearchCache(redis: RedisLike, ttlSeconds = DEFAULT_TTL_SECONDS) {
  /**
   * Generates a stable cache key from search parameters.
   */
  function buildCacheKey(filters: Record<string, unknown>, embedding?: number[]): string {
    const payload = JSON.stringify({ filters, hasEmbedding: !!embedding });
    const hash = createHash('sha256').update(payload).digest('hex').slice(0, 16);
    return `${REDIS_KEYS.SEARCH_CACHE}${hash}`;
  }

  return {
    /**
     * Gets cached search results. Returns null if cache miss.
     */
    async get(
      filters: Record<string, unknown>,
      embedding?: number[],
    ): Promise<CachedSearchEntry | null> {
      const key = buildCacheKey(filters, embedding);
      const cached = await redis.get(key);
      if (!cached) return null;

      try {
        return JSON.parse(cached) as CachedSearchEntry;
      } catch {
        return null;
      }
    },

    /**
     * Caches search results (list of IDs and total count).
     */
    async set(
      filters: Record<string, unknown>,
      ids: string[],
      totalCount: number,
      embedding?: number[],
    ): Promise<void> {
      const key = buildCacheKey(filters, embedding);
      const entry: CachedSearchEntry = {
        ids,
        totalCount,
        cachedAt: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(entry), 'EX', ttlSeconds);
    },

    /**
     * Paginates over cached IDs.
     * Returns the slice of IDs for the given page/limit.
     */
    paginate(ids: string[], page: number, limit: number): string[] {
      const offset = (page - 1) * limit;
      return ids.slice(offset, offset + limit);
    },

    /**
     * Invalidates a specific cache entry.
     */
    async invalidate(filters: Record<string, unknown>, embedding?: number[]): Promise<void> {
      const key = buildCacheKey(filters, embedding);
      await redis.del(key);
    },

    /** Exposed for testing. */
    buildCacheKey,
  };
}

/** Type of the search cache. */
export type SearchCache = ReturnType<typeof createSearchCache>;
