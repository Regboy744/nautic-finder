import { eq, and, ilike, desc } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { marketStats } from '../../../shared/db/schema/market-stats.js';

export type MarketStatsEntry = typeof marketStats.$inferSelect;
export type NewMarketStatsEntry = typeof marketStats.$inferInsert;

/**
 * Creates a market stats repository bound to a Drizzle DB instance.
 */
export function createMarketStatsRepository(db: Database['db']) {
  return {
    /** Finds market stats for a specific make/model. */
    async findByMakeAndModel(make: string, modelName: string): Promise<MarketStatsEntry[]> {
      return db
        .select()
        .from(marketStats)
        .where(and(ilike(marketStats.make, make), ilike(marketStats.modelName, modelName)))
        .orderBy(desc(marketStats.lastCalculatedAt));
    },

    /** Finds all market stats, newest first. */
    async findAll(limit = 100): Promise<MarketStatsEntry[]> {
      return db.select().from(marketStats).orderBy(desc(marketStats.lastCalculatedAt)).limit(limit);
    },

    /** Upserts a market stats entry. */
    async upsert(data: NewMarketStatsEntry): Promise<MarketStatsEntry> {
      // Check if entry exists for this make/model/year-range
      const existing = await db
        .select()
        .from(marketStats)
        .where(
          and(
            eq(marketStats.make, data.make),
            eq(marketStats.modelName, data.modelName),
            data.yearRange ? eq(marketStats.yearRange, data.yearRange) : undefined,
          ),
        )
        .limit(1);

      if (existing[0]) {
        const updated = await db
          .update(marketStats)
          .set({ ...data, lastCalculatedAt: new Date() })
          .where(eq(marketStats.id, existing[0].id))
          .returning();
        return updated[0];
      }

      const created = await db.insert(marketStats).values(data).returning();
      return created[0];
    },
  };
}

export type MarketStatsRepository = ReturnType<typeof createMarketStatsRepository>;
