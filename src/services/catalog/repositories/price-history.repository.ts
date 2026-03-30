import { eq, desc } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { priceHistory } from '../../../shared/db/schema/price-history.js';

export type PriceHistoryEntry = typeof priceHistory.$inferSelect;
export type NewPriceHistoryEntry = typeof priceHistory.$inferInsert;

/**
 * Creates a price history repository bound to a Drizzle DB instance.
 */
export function createPriceHistoryRepository(db: Database['db']) {
  return {
    /** Finds all price history entries for a listing, newest first. */
    async findByListingId(listingId: string): Promise<PriceHistoryEntry[]> {
      return db
        .select()
        .from(priceHistory)
        .where(eq(priceHistory.listingId, listingId))
        .orderBy(desc(priceHistory.recordedAt));
    },

    /** Appends a new price record. */
    async create(data: NewPriceHistoryEntry): Promise<PriceHistoryEntry> {
      const results = await db.insert(priceHistory).values(data).returning();
      return results[0];
    },
  };
}

export type PriceHistoryRepository = ReturnType<typeof createPriceHistoryRepository>;
