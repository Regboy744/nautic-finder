import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { z } from 'zod';
import { validate } from '../../gateway/middleware/validate.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import { idParamSchema, createConversationBodySchema, sendMessageBodySchema } from './schemas.js';
import type { ConversationService } from './conversation.service.js';

export interface ConversationRoutesOptions {
  conversationService: ConversationService;
}

function getUserId(request: FastifyRequest): string {
  if (!request.user) throw new UnauthorizedError();
  return request.user.id;
}

function conversationRoutes(server: FastifyInstance, opts: ConversationRoutesOptions): void {
  const { conversationService } = opts;

  // All conversation routes require authentication
  server.addHook('preHandler', server.authenticate);

  /** GET /api/v1/conversations — list user's conversations. */
  server.get(
    '/api/v1/conversations',
    { schema: { tags: ['Conversations'], description: 'List conversations' } },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const convs = await conversationService.list(getUserId(request));
      return { success: true, data: convs };
    },
  );

  /** POST /api/v1/conversations — create a new conversation. */
  server.post(
    '/api/v1/conversations',
    {
      preHandler: validate({ body: createConversationBodySchema }),
      schema: { tags: ['Conversations'], description: 'Create a conversation' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof createConversationBodySchema>;
      const conv = await conversationService.create(getUserId(request), body.title);
      return reply.status(201).send({ success: true, data: conv });
    },
  );

  /** GET /api/v1/conversations/:id — get a conversation with messages. */
  server.get(
    '/api/v1/conversations/:id',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Conversations'], description: 'Get a conversation' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const conv = await conversationService.getById(id);
      return { success: true, data: conv };
    },
  );

  /** DELETE /api/v1/conversations/:id — delete a conversation. */
  server.delete(
    '/api/v1/conversations/:id',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Conversations'], description: 'Delete a conversation' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      await conversationService.delete(id);
      return reply.status(204).send();
    },
  );

  /**
   * POST /api/v1/conversations/:id/messages — send a message.
   * This is THE CORE endpoint — triggers the full 8-step AI pipeline.
   */
  server.post(
    '/api/v1/conversations/:id/messages',
    {
      preHandler: validate({ params: idParamSchema, body: sendMessageBodySchema }),
      schema: { tags: ['Conversations'], description: 'Send a message (triggers AI pipeline)' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const { message } = request.body as z.infer<typeof sendMessageBodySchema>;

      const result = await conversationService.sendMessage(id, message);

      return {
        success: true,
        data: {
          response: result.response,
          isOffTopic: result.isOffTopic,
          filters: result.filters,
          boatsReferenced: result.boatsReferenced,
          timing: result.timing,
          conversationId: result.conversationId,
        },
      };
    },
  );
}

export default fp(conversationRoutes, {
  name: 'conversation-routes',
  fastify: '5.x',
});
