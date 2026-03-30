/**
 * Dynamic SQL filter builder for search queries.
 * Converts structured filter objects into Drizzle WHERE conditions.
 * Reuses the same filter logic from the catalog repository but
 * adds search-specific filters (keyword, has photos, etc.).
 */

import { eq, and, gte, lte, ilike, sql, type SQL } from 'drizzle-orm';
import { boatListings } from '../../shared/db/schema/boat-listings.js';
import type { ListingFilters } from '../../shared/types/index.js';

/** Extended search filters beyond basic listing filters. */
export interface SearchFilters extends ListingFilters {
  /** Free-text keyword search across title, description, make, model. */
  keyword?: string;
  /** Only include listings with at least one photo. */
  hasPhotos?: boolean;
  /** Only include listings with a condition score. */
  hasConditionScore?: boolean;
  /** Minimum condition score (1-10). */
  conditionScoreMin?: number;
}

/**
 * Builds an array of Drizzle SQL conditions from search filters.
 * Returns an empty array if no filters are active.
 */
export function buildSearchConditions(filters: SearchFilters): SQL[] {
  const conditions: SQL[] = [];

  // Always filter to active listings
  conditions.push(eq(boatListings.isActive, true));

  // Basic listing filters
  if (filters.boatType) {
    conditions.push(eq(boatListings.boatType, filters.boatType));
  }
  if (filters.make) {
    conditions.push(ilike(boatListings.make, `%${filters.make}%`));
  }
  if (filters.model) {
    conditions.push(ilike(boatListings.modelName, `%${filters.model}%`));
  }
  if (filters.yearMin !== undefined) {
    conditions.push(gte(boatListings.year, filters.yearMin));
  }
  if (filters.yearMax !== undefined) {
    conditions.push(lte(boatListings.year, filters.yearMax));
  }
  if (filters.priceMin !== undefined) {
    conditions.push(gte(boatListings.priceNormalizedEur, String(filters.priceMin)));
  }
  if (filters.priceMax !== undefined) {
    conditions.push(lte(boatListings.priceNormalizedEur, String(filters.priceMax)));
  }
  if (filters.country) {
    conditions.push(ilike(boatListings.country, `%${filters.country}%`));
  }
  if (filters.region) {
    conditions.push(ilike(boatListings.region, `%${filters.region}%`));
  }
  if (filters.lengthMinFt !== undefined) {
    conditions.push(gte(boatListings.lengthFt, String(filters.lengthMinFt)));
  }
  if (filters.lengthMaxFt !== undefined) {
    conditions.push(lte(boatListings.lengthFt, String(filters.lengthMaxFt)));
  }
  if (filters.hullMaterial) {
    conditions.push(eq(boatListings.hullMaterial, filters.hullMaterial));
  }
  if (filters.fuelType) {
    conditions.push(eq(boatListings.fuelType, filters.fuelType));
  }

  // Search-specific filters
  if (filters.keyword) {
    const kw = `%${filters.keyword}%`;
    conditions.push(
      sql`(${ilike(boatListings.title, kw)} OR ${ilike(boatListings.description, kw)} OR ${ilike(boatListings.make, kw)} OR ${ilike(boatListings.modelName, kw)})`,
    );
  }
  if (filters.hasPhotos) {
    conditions.push(sql`${boatListings.imageCount} > 0`);
  }
  if (filters.hasConditionScore) {
    conditions.push(sql`${boatListings.conditionScore} IS NOT NULL`);
  }
  if (filters.conditionScoreMin !== undefined) {
    conditions.push(gte(boatListings.conditionScore, filters.conditionScoreMin));
  }

  return conditions;
}

/**
 * Combines conditions into a single WHERE clause.
 * Returns undefined if no conditions (matches all rows).
 */
export function combineConditions(conditions: SQL[]): SQL | undefined {
  if (conditions.length === 0) return undefined;
  return and(...conditions);
}
