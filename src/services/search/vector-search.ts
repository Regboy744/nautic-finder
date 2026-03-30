/**
 * Vector search using pgvector cosine similarity.
 * Queries the boat_listings.embedding column for semantic similarity.
 */

import { sql, type SQL } from 'drizzle-orm';
import type { Database } from '../../shared/db/client.js';
import { boatListings } from '../../shared/db/schema/boat-listings.js';
import { MAX_VECTOR_RESULTS } from '../../shared/constants/index.js';

/** A listing result with its cosine similarity score. */
export interface VectorSearchResult {
  id: string;
  similarity: number;
}

/**
 * Performs a vector similarity search on boat listings.
 *
 * @param db - Drizzle database instance
 * @param embedding - Query embedding vector (1536 dimensions)
 * @param preFilterWhere - Optional WHERE clause to pre-filter before vector search
 * @param limit - Max results to return (default: MAX_VECTOR_RESULTS)
 * @returns Array of { id, similarity } sorted by similarity descending
 */
export async function vectorSearch(
  db: Database['db'],
  embedding: number[],
  preFilterWhere?: SQL,
  limit = MAX_VECTOR_RESULTS,
): Promise<VectorSearchResult[]> {
  // Convert embedding array to pgvector format
  const vectorStr = `[${embedding.join(',')}]`;

  // Build the query with cosine distance operator (<=>)
  // cosine_distance = 1 - cosine_similarity, so similarity = 1 - distance
  const query = db
    .select({
      id: boatListings.id,
      similarity: sql<number>`1 - (${boatListings.embedding} <=> ${vectorStr}::vector)`.as(
        'similarity',
      ),
    })
    .from(boatListings)
    .where(
      preFilterWhere
        ? sql`${boatListings.embedding} IS NOT NULL AND ${preFilterWhere}`
        : sql`${boatListings.embedding} IS NOT NULL`,
    )
    .orderBy(sql`${boatListings.embedding} <=> ${vectorStr}::vector`)
    .limit(limit);

  const results = await query;

  return results.map((r) => ({
    id: r.id,
    similarity: r.similarity,
  }));
}
