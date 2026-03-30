import { eq, desc } from 'drizzle-orm';
import type { Database } from '../../../shared/db/client.js';
import { conversations } from '../../../shared/db/schema/conversations.js';

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationMessage = NonNullable<Conversation['messages']>[number];

export function createConversationsRepository(db: Database['db']) {
  return {
    async findByUserId(userId: string, limit = 50): Promise<Conversation[]> {
      return db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit);
    },

    async findById(id: string): Promise<Conversation | null> {
      const results = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);
      return results[0] ?? null;
    },

    async create(data: NewConversation): Promise<Conversation> {
      const results = await db.insert(conversations).values(data).returning();
      return results[0];
    },

    /** Appends a message to the conversation's messages array and updates timestamp. */
    async appendMessage(id: string, message: ConversationMessage): Promise<Conversation | null> {
      // Fetch current messages, append, and update
      const current = await this.findById(id);
      if (!current) return null;

      const updatedMessages = [...(current.messages ?? []), message];
      const results = await db
        .update(conversations)
        .set({
          messages: updatedMessages,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, id))
        .returning();
      return results[0] ?? null;
    },

    /** Updates conversation metadata (title, searchContext). */
    async update(
      id: string,
      data: Partial<Pick<Conversation, 'title' | 'searchContext'>>,
    ): Promise<Conversation | null> {
      const results = await db
        .update(conversations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();
      return results[0] ?? null;
    },

    async delete(id: string): Promise<boolean> {
      const results = await db
        .delete(conversations)
        .where(eq(conversations.id, id))
        .returning({ id: conversations.id });
      return results.length > 0;
    },
  };
}

export type ConversationsRepository = ReturnType<typeof createConversationsRepository>;
