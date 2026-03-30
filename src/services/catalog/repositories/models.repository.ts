import { eq, ilike, and, type SQL, count, desc } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { boatModels } from '../../../shared/db/schema/boat-models.js';

/** Inferred types from Drizzle schema. */
export type BoatModel = typeof boatModels.$inferSelect;
export type NewBoatModel = typeof boatModels.$inferInsert;

/**
 * Creates a models repository bound to a Drizzle DB instance.
 */
export function createModelsRepository(db: Database['db']) {
  return {
    /**
     * Finds paginated models with optional make/type filters.
     */
    async findMany(
      filters: { make?: string; boatType?: string },
      offset: number,
      limit: number,
    ): Promise<{ items: BoatModel[]; total: number }> {
      const conditions: SQL[] = [];
      if (filters.make) conditions.push(ilike(boatModels.make, `%${filters.make}%`));
      if (filters.boatType) conditions.push(eq(boatModels.boatType, filters.boatType));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(boatModels)
          .where(where)
          .orderBy(desc(boatModels.createdAt))
          .offset(offset)
          .limit(limit),
        db.select({ count: count() }).from(boatModels).where(where),
      ]);

      return { items, total: totalResult[0]?.count ?? 0 };
    },

    /** Finds a single model by ID. */
    async findById(id: string): Promise<BoatModel | null> {
      const results = await db.select().from(boatModels).where(eq(boatModels.id, id)).limit(1);
      return results[0] ?? null;
    },

    /** Fuzzy-matches a model by make + model name. Used for auto-linking. */
    async findByMakeAndModel(make: string, modelName: string): Promise<BoatModel | null> {
      const results = await db
        .select()
        .from(boatModels)
        .where(and(ilike(boatModels.make, make), ilike(boatModels.modelName, modelName)))
        .limit(1);
      return results[0] ?? null;
    },

    /** Creates a new model. Returns the created row. */
    async create(data: NewBoatModel): Promise<BoatModel> {
      const results = await db.insert(boatModels).values(data).returning();
      return results[0];
    },

    /** Updates a model by ID. Returns the updated row or null. */
    async update(id: string, data: Partial<NewBoatModel>): Promise<BoatModel | null> {
      const results = await db
        .update(boatModels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(boatModels.id, id))
        .returning();
      return results[0] ?? null;
    },
  };
}

export type ModelsRepository = ReturnType<typeof createModelsRepository>;
