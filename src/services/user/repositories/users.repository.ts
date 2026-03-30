import { eq } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { users } from '../../../shared/db/schema/users.js';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export function createUsersRepository(db: Database['db']) {
  return {
    async findById(id: string): Promise<User | null> {
      const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return results[0] ?? null;
    },

    async findByEmail(email: string): Promise<User | null> {
      const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return results[0] ?? null;
    },

    async create(data: NewUser): Promise<User> {
      const results = await db.insert(users).values(data).returning();
      return results[0];
    },

    async update(id: string, data: Partial<NewUser>): Promise<User | null> {
      const results = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return results[0] ?? null;
    },

    async delete(id: string): Promise<boolean> {
      const results = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return results.length > 0;
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
