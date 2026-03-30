/**
 * Result scorer — ranks search results using weighted scoring.
 *
 * Weights:
 * - Vector similarity: 40%
 * - Photo quality: 15% (has photos, count)
 * - Freshness: 15% (how recently listed/updated)
 * - Condition: 15% (AI condition score)
 * - Completeness: 15% (how many fields are filled)
 */

import type { BoatListing } from '../catalog/repositories/listings.repository.js';

/** Scoring weights — must sum to 1.0 */
export const SCORE_WEIGHTS = {
  similarity: 0.4,
  photos: 0.15,
  freshness: 0.15,
  condition: 0.15,
  completeness: 0.15,
} as const;

/** A scored search result. */
export interface ScoredResult {
  listing: BoatListing;
  score: number;
  /** Individual score components for debugging/transparency. */
  breakdown: {
    similarity: number;
    photos: number;
    freshness: number;
    condition: number;
    completeness: number;
  };
}

/**
 * Scores and ranks a set of listings based on multiple quality signals.
 *
 * @param listings - The listings to score
 * @param similarityMap - Map of listing ID → cosine similarity (0-1). Absent = 0.
 * @returns Listings sorted by score descending
 */
export function scoreResults(
  listings: BoatListing[],
  similarityMap: Map<string, number>,
): ScoredResult[] {
  const now = Date.now();

  const scored = listings.map((listing) => {
    const similarity = similarityMap.get(listing.id) ?? 0;
    const photos = scorePhotos(listing);
    const freshness = scoreFreshness(listing, now);
    const condition = scoreCondition(listing);
    const completeness = scoreCompleteness(listing);

    const score =
      similarity * SCORE_WEIGHTS.similarity +
      photos * SCORE_WEIGHTS.photos +
      freshness * SCORE_WEIGHTS.freshness +
      condition * SCORE_WEIGHTS.condition +
      completeness * SCORE_WEIGHTS.completeness;

    return {
      listing,
      score: Math.round(score * 1000) / 1000,
      breakdown: {
        similarity: round(similarity),
        photos: round(photos),
        freshness: round(freshness),
        condition: round(condition),
        completeness: round(completeness),
      },
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Photo quality score (0-1).
 * More photos = higher score. Caps at 20 photos.
 */
function scorePhotos(listing: BoatListing): number {
  const count = listing.imageCount ?? 0;
  if (count === 0) return 0;
  // Logarithmic scale: diminishing returns after ~10 photos
  return Math.min(1, Math.log(count + 1) / Math.log(21));
}

/**
 * Freshness score (0-1).
 * Recently listed/updated listings score higher.
 * 30-day decay window.
 */
function scoreFreshness(listing: BoatListing, now: number): number {
  const lastSeen = listing.lastSeenAt?.getTime() ?? listing.createdAt.getTime();
  const ageMs = now - lastSeen;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Linear decay over 30 days
  if (ageDays <= 0) return 1;
  if (ageDays >= 30) return 0;
  return 1 - ageDays / 30;
}

/**
 * Condition score (0-1).
 * Based on AI-generated condition score (1-10).
 * Missing score = 0.5 (neutral).
 */
function scoreCondition(listing: BoatListing): number {
  const score = listing.conditionScore;
  if (score === null || score === undefined) return 0.5;
  return Math.min(1, Math.max(0, score / 10));
}

/**
 * Completeness score (0-1).
 * How many important fields are filled in.
 */
function scoreCompleteness(listing: BoatListing): number {
  const importantFields = [
    listing.title,
    listing.make,
    listing.modelName,
    listing.year,
    listing.price,
    listing.country,
    listing.description,
    listing.lengthFt,
    listing.hullMaterial,
    listing.boatType,
  ];

  const filled = importantFields.filter((v) => v !== null && v !== undefined).length;
  return filled / importantFields.length;
}

/** Rounds to 3 decimal places. */
function round(num: number): number {
  return Math.round(num * 1000) / 1000;
}
