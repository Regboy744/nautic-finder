import { eq, and, gte, lte, ilike, sql, desc, asc, type SQL, count } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { boatListings } from '../../../shared/db/schema/boat-listings.js';
import { boatModels } from '../../../shared/db/schema/boat-models.js';
import type { ListingFilters, SortDirection } from '../../../shared/types/index.js';

/** Inferred types from Drizzle schema. */
export type BoatListing = typeof boatListings.$inferSelect;
export type NewBoatListing = typeof boatListings.$inferInsert;

/** Listing with optional joined model data. */
export type ListingWithModel = BoatListing & {
  model: typeof boatModels.$inferSelect | null;
};

/** Sort options for listings. */
export interface ListingSortOptions {
  sortBy?: string;
  sortDirection?: SortDirection;
}

/**
 * Creates a listings repository bound to a Drizzle DB instance.
 * Handles all boat_listings table operations.
 */
export function createListingsRepository(db: Database['db']) {
  /**
   * Builds dynamic WHERE conditions from listing filters.
   */
  function buildWhereConditions(filters: ListingFilters): SQL[] {
    const conditions: SQL[] = [];

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
    if (filters.isActive !== undefined) {
      conditions.push(eq(boatListings.isActive, filters.isActive));
    }

    return conditions;
  }

  /**
   * Builds an ORDER BY expression from sort field and direction.
   */
  function buildOrderBy(sortBy: string, direction: 'asc' | 'desc'): SQL {
    const dir = direction === 'asc' ? asc : desc;
    switch (sortBy) {
      case 'price':
        return dir(boatListings.priceNormalizedEur);
      case 'year':
        return dir(boatListings.year);
      case 'length':
        return dir(boatListings.lengthFt);
      case 'updated':
        return dir(boatListings.updatedAt);
      case 'firstSeen':
        return dir(boatListings.firstSeenAt);
      default:
        return dir(boatListings.createdAt);
    }
  }

  return {
    /**
     * Finds paginated listings with optional filters.
     * Returns items + total count for pagination meta.
     */
    async findMany(
      filters: ListingFilters,
      offset: number,
      limit: number,
      sort?: ListingSortOptions,
    ): Promise<{ items: BoatListing[]; total: number }> {
      const conditions = buildWhereConditions(filters);
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const orderBy = buildOrderBy(sort?.sortBy ?? 'created', sort?.sortDirection ?? 'desc');

      const [items, totalResult] = await Promise.all([
        db.select().from(boatListings).where(where).orderBy(orderBy).offset(offset).limit(limit),
        db.select({ count: count() }).from(boatListings).where(where),
      ]);

      return {
        items,
        total: totalResult[0]?.count ?? 0,
      };
    },

    /**
     * Finds a single listing by ID with optional model join.
     */
    async findById(id: string): Promise<ListingWithModel | null> {
      const results = await db
        .select()
        .from(boatListings)
        .leftJoin(boatModels, eq(boatListings.modelId, boatModels.id))
        .where(eq(boatListings.id, id))
        .limit(1);

      const row = results[0];
      if (!row) return null;

      return {
        ...row.boat_listings,
        model: row.boat_models,
      };
    },

    /**
     * Finds a listing by its external ID and source platform (for dedup).
     */
    async findByExternalId(
      externalId: string,
      sourcePlatform: string,
    ): Promise<BoatListing | null> {
      const results = await db
        .select()
        .from(boatListings)
        .where(
          and(
            eq(boatListings.externalId, externalId),
            eq(boatListings.sourcePlatform, sourcePlatform),
          ),
        )
        .limit(1);

      return results[0] ?? null;
    },

    /**
     * Finds a listing by its fingerprint (for dedup).
     */
    async findByFingerprint(fingerprint: string): Promise<BoatListing | null> {
      const results = await db
        .select()
        .from(boatListings)
        .where(eq(boatListings.fingerprint, fingerprint))
        .limit(1);

      return results[0] ?? null;
    },

    /**
     * Creates a new listing. Returns the created row.
     */
    async create(data: NewBoatListing): Promise<BoatListing> {
      const results = await db.insert(boatListings).values(data).returning();

      return results[0];
    },

    /**
     * Updates a listing by ID. Returns the updated row or null if not found.
     */
    async update(id: string, data: Partial<NewBoatListing>): Promise<BoatListing | null> {
      const results = await db
        .update(boatListings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(boatListings.id, id))
        .returning();

      return results[0] ?? null;
    },

    /**
     * Marks a listing as inactive (soft delete).
     */
    async deactivate(id: string): Promise<boolean> {
      const results = await db
        .update(boatListings)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(boatListings.id, id))
        .returning({ id: boatListings.id });

      return results.length > 0;
    },

    /**
     * Finds similar listings by make, model, year range, and boat type.
     * Excludes the source listing.
     */
    async findSimilar(listing: BoatListing, limit = 5): Promise<BoatListing[]> {
      const conditions: SQL[] = [
        eq(boatListings.isActive, true),
        sql`${boatListings.id} != ${listing.id}`,
      ];

      if (listing.make) {
        conditions.push(ilike(boatListings.make, `%${listing.make}%`));
      }
      if (listing.boatType) {
        conditions.push(eq(boatListings.boatType, listing.boatType));
      }
      if (listing.year) {
        conditions.push(gte(boatListings.year, listing.year - 5));
        conditions.push(lte(boatListings.year, listing.year + 5));
      }

      return db
        .select()
        .from(boatListings)
        .where(and(...conditions))
        .orderBy(desc(boatListings.lastSeenAt))
        .limit(limit);
    },

    /**
     * Counts total active listings.
     */
    async countActive(): Promise<number> {
      const result = await db
        .select({ count: count() })
        .from(boatListings)
        .where(eq(boatListings.isActive, true));

      return result[0]?.count ?? 0;
    },
  };
}

/** Type of the listings repository. */
export type ListingsRepository = ReturnType<typeof createListingsRepository>;
