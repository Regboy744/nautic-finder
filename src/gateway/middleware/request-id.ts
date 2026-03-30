import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Request-ID propagation plugin.
 * Ensures every response includes an X-Request-ID header matching the request.
 * Fastify already generates request IDs via `genReqId` in server.ts;
 * this plugin just propagates them to responses.
 */
function requestIdPlugin(server: FastifyInstance): void {
  server.addHook('onSend', async (request, reply) => {
    const requestId = request.id;
    if (requestId) {
      void reply.header('X-Request-ID', requestId);
    }
  });
}

export default fp(requestIdPlugin, {
  name: 'request-id',
  fastify: '5.x',
});
