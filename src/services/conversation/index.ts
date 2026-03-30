import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Database } from '../../shared/db/client.js';
import { createServiceLogger } from '../../shared/logger/index.js';
import { createConversationsRepository } from './repositories/conversations.repository.js';
import { createConversationService } from './conversation.service.js';
import { createPipeline, type PipelineDeps } from './pipeline.js';
import conversationRoutes from './routes.js';

/** Options for the conversation plugin. */
export interface ConversationPluginOptions {
  db: Database['db'];
  /** Pipeline dependencies — injected from the AI and search services. */
  pipelineDeps: Omit<PipelineDeps, 'log'>;
}

async function conversationPlugin(
  server: FastifyInstance,
  opts: ConversationPluginOptions,
): Promise<void> {
  const log = createServiceLogger('conversation');

  const conversationsRepo = createConversationsRepository(opts.db);
  const pipeline = createPipeline({ ...opts.pipelineDeps, log });
  const conversationService = createConversationService({ conversationsRepo, pipeline, log });

  await server.register(conversationRoutes, { conversationService });

  log.info('Conversation service registered');
}

export default fp(conversationPlugin, {
  name: 'conversation',
  fastify: '5.x',
});
