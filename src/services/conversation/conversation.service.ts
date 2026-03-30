import type { Logger } from 'pino';
import type {
  ConversationsRepository,
  Conversation,
  ConversationMessage,
} from './repositories/conversations.repository.js';
import type { Pipeline, PipelineResult } from './pipeline.js';
import { NotFoundError } from '../../shared/errors/index.js';
import type { ChatMessage } from '../ai/types.js';

export interface ConversationServiceDeps {
  conversationsRepo: ConversationsRepository;
  pipeline: Pipeline;
  log: Logger;
}

export function createConversationService(deps: ConversationServiceDeps) {
  const { conversationsRepo, pipeline, log } = deps;

  return {
    /** Lists conversations for a user. */
    async list(userId: string): Promise<Conversation[]> {
      return conversationsRepo.findByUserId(userId);
    },

    /** Gets a single conversation. */
    async getById(id: string): Promise<Conversation> {
      const conv = await conversationsRepo.findById(id);
      if (!conv) throw new NotFoundError('Conversation', id);
      return conv;
    },

    /** Creates a new conversation. */
    async create(userId: string, title?: string): Promise<Conversation> {
      const conv = await conversationsRepo.create({
        userId,
        title: title ?? 'New conversation',
        messages: [],
      });
      log.info({ conversationId: conv.id, userId }, 'Conversation created');
      return conv;
    },

    /** Deletes a conversation. */
    async delete(id: string): Promise<void> {
      const deleted = await conversationsRepo.delete(id);
      if (!deleted) throw new NotFoundError('Conversation', id);
    },

    /**
     * Sends a message and runs the full AI pipeline.
     * Appends both the user message and AI response to the conversation.
     */
    async sendMessage(
      conversationId: string,
      userMessage: string,
    ): Promise<PipelineResult & { conversationId: string }> {
      // Get existing conversation
      const conv = await conversationsRepo.findById(conversationId);
      if (!conv) throw new NotFoundError('Conversation', conversationId);

      // Build chat history from existing messages
      const history: ChatMessage[] = (conv.messages ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Run the pipeline
      const result = await pipeline.process({
        message: userMessage,
        history,
      });

      // Append user message
      const userMsg: ConversationMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      await conversationsRepo.appendMessage(conversationId, userMsg);

      // Append assistant response
      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        boatsReferenced: result.boatsReferenced,
      };
      await conversationsRepo.appendMessage(conversationId, assistantMsg);

      // Auto-generate title from first message if still default
      if (conv.title === 'New conversation' && !result.isOffTopic) {
        const autoTitle = userMessage.slice(0, 60) + (userMessage.length > 60 ? '...' : '');
        await conversationsRepo.update(conversationId, { title: autoTitle });
      }

      log.info(
        {
          conversationId,
          isOffTopic: result.isOffTopic,
          totalMs: result.timing.total,
          boatsFound: result.boatsReferenced.length,
        },
        'Message processed',
      );

      return { ...result, conversationId };
    },
  };
}

export type ConversationService = ReturnType<typeof createConversationService>;
