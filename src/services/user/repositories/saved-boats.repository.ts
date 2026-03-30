import { eq, and, count } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { savedBoats } from '../../../shared/db/schema/saved-boats.js';
import { boatListings } from '../../../shared/db/schema/boat-listings.js';

export type SavedBoat = typeof savedBoats.$inferSelect;
export type NewSavedBoat = typeof savedBoats.$inferInsert;

/** Saved boat with listing details. */
export type SavedBoatWithListing = SavedBoat & {
  listing: typeof boatListings.$inferSelect | null;
};

export function createSavedBoatsRepository(db: Database['db']) {
  return {
    /** Finds all saved boats for a user with listing data. */
    async findByUserId(userId: string): Promise<SavedBoatWithListing[]> {
      const results = await db
        .select()
        .from(savedBoats)
        .leftJoin(boatListings, eq(savedBoats.listingId, boatListings.id))
        .where(eq(savedBoats.userId, userId))
        .orderBy(savedBoats.createdAt);

      return results.map((r) => ({
        ...r.saved_boats,
        listing: r.boat_listings,
      }));
    },

    /** Checks if a user has saved a specific listing. */
    async exists(userId: string, listingId: string): Promise<boolean> {
      const results = await db
        .select({ count: count() })
        .from(savedBoats)
        .where(and(eq(savedBoats.userId, userId), eq(savedBoats.listingId, listingId)));
      return (results[0]?.count ?? 0) > 0;
    },

    /** Saves a boat for a user. Returns the saved entry. */
    async create(data: NewSavedBoat): Promise<SavedBoat> {
      const results = await db.insert(savedBoats).values(data).returning();
      return results[0];
    },

    /** Removes a saved boat by ID (must belong to user). */
    async delete(id: string, userId: string): Promise<boolean> {
      const results = await db
        .delete(savedBoats)
        .where(and(eq(savedBoats.id, id), eq(savedBoats.userId, userId)))
        .returning({ id: savedBoats.id });
      return results.length > 0;
    },

    /** Counts saved boats for a user. */
    async countByUserId(userId: string): Promise<number> {
      const results = await db
        .select({ count: count() })
        .from(savedBoats)
        .where(eq(savedBoats.userId, userId));
      return results[0]?.count ?? 0;
    },
  };
}

export type SavedBoatsRepository = ReturnType<typeof createSavedBoatsRepository>;
