import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { z } from 'zod';
import { validate } from '../../gateway/middleware/validate.js';
import { matchListingBodySchema } from './schemas.js';
import type { NotificationService } from './service.js';

export interface NotificationRoutesOptions {
  notificationService: NotificationService;
}

function notificationRoutes(server: FastifyInstance, opts: NotificationRoutesOptions): void {
  const { notificationService } = opts;

  // Internal-only endpoint. Requires auth.
  server.addHook('preHandler', server.authenticate);

  server.post(
    '/api/v1/internal/notifications/match-listing',
    {
      preHandler: validate({ body: matchListingBodySchema }),
      schema: {
        tags: ['Internal'],
        description: 'Trigger alert matching for a listing',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof matchListingBodySchema>;
      await notificationService.enqueueListingMatch(body.listingId, body.isNew, body.isPriceChange);

      return reply.status(202).send({
        success: true,
        data: {
          queued: true,
          listingId: body.listingId,
          isNew: body.isNew,
          isPriceChange: body.isPriceChange,
        },
      });
    },
  );
}

export default fp(notificationRoutes, {
  name: 'notification-routes',
  fastify: '5.x',
});
