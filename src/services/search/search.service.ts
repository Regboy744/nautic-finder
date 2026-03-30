/**
 * Search service — orchestrates the full search pipeline:
 * 1. Check cache → 2. Build SQL filters → 3. Pre-filter listings
 * 4. Vector search (if embedding) → 5. Score results → 6. Cache → 7. Paginate
 */

import type { Logger } from 'pino';
import { desc, sql, count, inArray } from 'drizzle-orm';
import type { Database } from '../../shared/db/client.js';
import { boatListings } from '../../shared/db/schema/boat-listings.js';
import type { PaginatedResponse, PaginationMeta } from '../../shared/types/index.js';
import type { BoatListing } from '../catalog/repositories/listings.repository.js';
import { normalizePagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { buildSearchConditions, combineConditions, type SearchFilters } from './filter-builder.js';
import { vectorSearch } from './vector-search.js';
import { scoreResults, type ScoredResult } from './scorer.js';
import type { SearchCache } from './search-cache.js';

/** Dependencies injected into the search service. */
export interface SearchServiceDeps {
  db: Database['db'];
  cache: SearchCache | null;
  log: Logger;
}

/** Search request parameters. */
export interface SearchRequest {
  filters: SearchFilters;
  /** Optional embedding vector for semantic search. */
  embedding?: number[];
  page?: number;
  limit?: number;
}

/** Search response with scored results. */
export interface SearchResponse extends PaginatedResponse<ScoredResult> {
  cached: boolean;
}

/**
 * Creates the search service.
 */
export function createSearchService(deps: SearchServiceDeps) {
  const { db, cache, log } = deps;

  return {
    /**
     * Performs a full search with optional semantic ranking.
     */
    async search(request: SearchRequest): Promise<SearchResponse> {
      const { page, limit } = normalizePagination({
        page: request.page,
        limit: request.limit,
      });

      // Step 1: Check cache
      if (cache) {
        const cached = await cache.get(
          request.filters as unknown as Record<string, unknown>,
          request.embedding,
        );
        if (cached) {
          log.debug({ cacheHit: true }, 'Search cache hit');
          const pageIds = cache.paginate(cached.ids, page, limit);
          const listings = await fetchListingsByIds(pageIds);
          const pagination = buildPaginationMeta(cached.totalCount, page, limit);

          // Re-score with similarity=0 (no vector data in cache)
          const scored = scoreResults(listings, new Map());

          return {
            success: true,
            data: scored,
            pagination,
            cached: true,
          };
        }
      }

      // Step 2: Build SQL filter conditions
      const conditions = buildSearchConditions(request.filters);
      const where = combineConditions(conditions);

      // Step 3: Get total count for pagination
      const [countResult] = await db.select({ count: count() }).from(boatListings).where(where);
      const total = countResult?.count ?? 0;

      // Step 4: Vector search (if embedding provided)
      let similarityMap = new Map<string, number>();
      let orderedIds: string[] | null = null;

      if (request.embedding) {
        const vectorResults = await vectorSearch(db, request.embedding, where);
        similarityMap = new Map(vectorResults.map((r) => [r.id, r.similarity]));
        orderedIds = vectorResults.map((r) => r.id);

        log.debug({ vectorResults: vectorResults.length }, 'Vector search completed');
      }

      // Step 5: Fetch listings (vector-ordered or default)
      let listings: BoatListing[];

      if (orderedIds) {
        // Fetch all vector results for scoring, then paginate after scoring
        listings = await fetchListingsByIds(orderedIds);
      } else {
        // No vector search — use SQL pagination directly
        const offset = (page - 1) * limit;
        listings = await db
          .select()
          .from(boatListings)
          .where(where)
          .orderBy(desc(boatListings.lastSeenAt))
          .offset(offset)
          .limit(limit);
      }

      // Step 6: Score results
      const scored = scoreResults(listings, similarityMap);

      // Step 7: Cache the full result set IDs
      if (cache && scored.length > 0) {
        const allIds = scored.map((r) => r.listing.id);
        await cache
          .set(
            request.filters as unknown as Record<string, unknown>,
            allIds,
            total,
            request.embedding,
          )
          .catch((err) => {
            log.warn({ err }, 'Failed to cache search results');
          });
      }

      // Step 8: Paginate scored results (for vector search, all results were fetched)
      let pageResults: ScoredResult[];
      let pagination: PaginationMeta;

      if (orderedIds) {
        const offset = (page - 1) * limit;
        pageResults = scored.slice(offset, offset + limit);
        pagination = buildPaginationMeta(scored.length, page, limit);
      } else {
        pageResults = scored;
        pagination = buildPaginationMeta(total, page, limit);
      }

      return {
        success: true,
        data: pageResults,
        pagination,
        cached: false,
      };
    },

    /**
     * Gets search suggestions based on popular makes, types, and locations.
     */
    async getSuggestions(): Promise<{
      makes: string[];
      boatTypes: string[];
      countries: string[];
    }> {
      const [makes, boatTypes, countries] = await Promise.all([
        db
          .select({ make: boatListings.make })
          .from(boatListings)
          .where(sql`${boatListings.make} IS NOT NULL AND ${boatListings.isActive} = true`)
          .groupBy(boatListings.make)
          .orderBy(sql`count(*) desc`)
          .limit(30),
        db
          .select({ boatType: boatListings.boatType })
          .from(boatListings)
          .where(sql`${boatListings.boatType} IS NOT NULL AND ${boatListings.isActive} = true`)
          .groupBy(boatListings.boatType)
          .orderBy(sql`count(*) desc`)
          .limit(15),
        db
          .select({ country: boatListings.country })
          .from(boatListings)
          .where(sql`${boatListings.country} IS NOT NULL AND ${boatListings.isActive} = true`)
          .groupBy(boatListings.country)
          .orderBy(sql`count(*) desc`)
          .limit(30),
      ]);

      return {
        makes: makes.map((r) => r.make).filter(Boolean) as string[],
        boatTypes: boatTypes.map((r) => r.boatType).filter(Boolean) as string[],
        countries: countries.map((r) => r.country).filter(Boolean) as string[],
      };
    },
  };

  /**
   * Fetches listings by an ordered list of IDs, preserving order.
   */
  async function fetchListingsByIds(ids: string[]): Promise<BoatListing[]> {
    if (ids.length === 0) return [];

    const results = await db.select().from(boatListings).where(inArray(boatListings.id, ids));

    // Preserve the original ID ordering
    const byId = new Map(results.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as BoatListing[];
  }
}

export type SearchService = ReturnType<typeof createSearchService>;
