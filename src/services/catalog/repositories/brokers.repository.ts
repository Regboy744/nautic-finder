import { eq, count, desc } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { brokers } from '../../../shared/db/schema/brokers.js';

export type Broker = typeof brokers.$inferSelect;
export type NewBroker = typeof brokers.$inferInsert;

/**
 * Creates a brokers repository bound to a Drizzle DB instance.
 */
export function createBrokersRepository(db: Database['db']) {
  return {
    /** Finds all brokers, ordered by listing count. */
    async findAll(): Promise<Broker[]> {
      return db.select().from(brokers).orderBy(desc(brokers.totalListings));
    },

    /** Finds active brokers only. */
    async findActive(): Promise<Broker[]> {
      return db
        .select()
        .from(brokers)
        .where(eq(brokers.isActive, true))
        .orderBy(desc(brokers.totalListings));
    },

    /** Finds a broker by ID. */
    async findById(id: string): Promise<Broker | null> {
      const results = await db.select().from(brokers).where(eq(brokers.id, id)).limit(1);
      return results[0] ?? null;
    },

    /** Creates a new broker. */
    async create(data: NewBroker): Promise<Broker> {
      const results = await db.insert(brokers).values(data).returning();
      return results[0];
    },

    /** Updates a broker by ID. */
    async update(id: string, data: Partial<NewBroker>): Promise<Broker | null> {
      const results = await db
        .update(brokers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(brokers.id, id))
        .returning();
      return results[0] ?? null;
    },

    /** Counts total brokers. */
    async countAll(): Promise<number> {
      const result = await db.select({ count: count() }).from(brokers);
      return result[0]?.count ?? 0;
    },
  };
}

export type BrokersRepository = ReturnType<typeof createBrokersRepository>;
