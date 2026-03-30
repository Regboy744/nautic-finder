import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { searchAlerts } from '../../../shared/db/schema/search-alerts.js';

export type SearchAlert = typeof searchAlerts.$inferSelect;
export type NewSearchAlert = typeof searchAlerts.$inferInsert;

export function createSearchAlertsRepository(db: Database['db']) {
  return {
    /** Finds all alerts for a user. */
    async findByUserId(userId: string): Promise<SearchAlert[]> {
      return db
        .select()
        .from(searchAlerts)
        .where(eq(searchAlerts.userId, userId))
        .orderBy(desc(searchAlerts.createdAt));
    },

    /** Finds a single alert by ID. */
    async findById(id: string): Promise<SearchAlert | null> {
      const results = await db.select().from(searchAlerts).where(eq(searchAlerts.id, id)).limit(1);
      return results[0] ?? null;
    },

    /** Creates a new alert. */
    async create(data: NewSearchAlert): Promise<SearchAlert> {
      const results = await db.insert(searchAlerts).values(data).returning();
      return results[0];
    },

    /** Updates an alert (must belong to user). */
    async update(
      id: string,
      userId: string,
      data: Partial<NewSearchAlert>,
    ): Promise<SearchAlert | null> {
      const results = await db
        .update(searchAlerts)
        .set(data)
        .where(and(eq(searchAlerts.id, id), eq(searchAlerts.userId, userId)))
        .returning();
      return results[0] ?? null;
    },

    /** Deletes an alert (must belong to user). */
    async delete(id: string, userId: string): Promise<boolean> {
      const results = await db
        .delete(searchAlerts)
        .where(and(eq(searchAlerts.id, id), eq(searchAlerts.userId, userId)))
        .returning({ id: searchAlerts.id });
      return results.length > 0;
    },

    /** Finds all active alerts (for notification worker). */
    async findActive(): Promise<SearchAlert[]> {
      return db.select().from(searchAlerts).where(eq(searchAlerts.isActive, true));
    },
  };
}

export type SearchAlertsRepository = ReturnType<typeof createSearchAlertsRepository>;
