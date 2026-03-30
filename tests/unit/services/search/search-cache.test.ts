import { describe, it, expect, vi } from 'vitest';
import { createSearchCache } from '../../../../src/services/search/search-cache.js';

function mockRedis() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  };
}

describe('SearchCache', () => {
  describe('get', () => {
    it('returns null on cache miss', async () => {
      const redis = mockRedis();
      const cache = createSearchCache(redis);

      const result = await cache.get({ keyword: 'bavaria' });
      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalledOnce();
    });

    it('returns parsed entry on cache hit', async () => {
      const redis = mockRedis();
      const entry = { ids: ['id-1', 'id-2'], totalCount: 2, cachedAt: new Date().toISOString() };
      redis.get.mockResolvedValue(JSON.stringify(entry));

      const cache = createSearchCache(redis);
      const result = await cache.get({ keyword: 'bavaria' });

      expect(result).not.toBeNull();
      expect(result!.ids).toEqual(['id-1', 'id-2']);
      expect(result!.totalCount).toBe(2);
    });
  });

  describe('set', () => {
    it('stores entry with TTL', async () => {
      const redis = mockRedis();
      const cache = createSearchCache(redis, 1800);

      await cache.set({ keyword: 'bavaria' }, ['id-1'], 1);

      expect(redis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 1800);
    });
  });

  describe('paginate', () => {
    it('returns correct page slice', () => {
      const cache = createSearchCache(mockRedis());
      const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

      expect(cache.paginate(ids, 1, 3)).toEqual(['a', 'b', 'c']);
      expect(cache.paginate(ids, 2, 3)).toEqual(['d', 'e', 'f']);
      expect(cache.paginate(ids, 4, 3)).toEqual(['j']);
    });

    it('returns empty for out of range page', () => {
      const cache = createSearchCache(mockRedis());
      expect(cache.paginate(['a', 'b'], 5, 10)).toEqual([]);
    });
  });

  describe('invalidate', () => {
    it('deletes the cache key', async () => {
      const redis = mockRedis();
      const cache = createSearchCache(redis);

      await cache.invalidate({ keyword: 'bavaria' });

      expect(redis.del).toHaveBeenCalledOnce();
    });
  });

  describe('buildCacheKey', () => {
    it('generates consistent keys for same filters', () => {
      const cache = createSearchCache(mockRedis());
      const key1 = cache.buildCacheKey({ keyword: 'bavaria' });
      const key2 = cache.buildCacheKey({ keyword: 'bavaria' });
      expect(key1).toBe(key2);
    });

    it('generates different keys for different filters', () => {
      const cache = createSearchCache(mockRedis());
      const key1 = cache.buildCacheKey({ keyword: 'bavaria' });
      const key2 = cache.buildCacheKey({ keyword: 'beneteau' });
      expect(key1).not.toBe(key2);
    });

    it('includes embedding presence in key', () => {
      const cache = createSearchCache(mockRedis());
      const key1 = cache.buildCacheKey({ keyword: 'bavaria' });
      const key2 = cache.buildCacheKey({ keyword: 'bavaria' }, [0.1, 0.2]);
      expect(key1).not.toBe(key2);
    });
  });
});
