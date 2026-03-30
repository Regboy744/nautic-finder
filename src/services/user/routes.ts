import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { z } from 'zod';
import { validate } from '../../gateway/middleware/validate.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import {
  updateProfileBodySchema,
  saveBoatBodySchema,
  idParamSchema,
  createAlertBodySchema,
  updateAlertBodySchema,
} from './schemas.js';
import type { UserService } from './user.service.js';

export interface UserRoutesOptions {
  userService: UserService;
}

/** Helper to get the authenticated user ID from request. */
function getUserId(request: FastifyRequest): string {
  if (!request.user) throw new UnauthorizedError();
  return request.user.id;
}

function userRoutes(server: FastifyInstance, opts: UserRoutesOptions): void {
  const { userService } = opts;

  // All user routes require authentication
  server.addHook('preHandler', server.authenticate);

  // -- Profile --

  server.get(
    '/api/v1/users/me',
    { schema: { tags: ['Users'], description: 'Get current user profile' } },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = await userService.getProfile(getUserId(request));
      return { success: true, data: user };
    },
  );

  server.put(
    '/api/v1/users/me',
    {
      preHandler: validate({ body: updateProfileBodySchema }),
      schema: { tags: ['Users'], description: 'Update current user profile' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const body = request.body as z.infer<typeof updateProfileBodySchema>;
      const user = await userService.updateProfile(getUserId(request), body);
      return { success: true, data: user };
    },
  );

  // -- Saved Boats --

  server.get(
    '/api/v1/users/me/saved-boats',
    { schema: { tags: ['Saved Boats'], description: 'Get saved boats' } },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const boats = await userService.getSavedBoats(getUserId(request));
      return { success: true, data: boats };
    },
  );

  server.post(
    '/api/v1/users/me/saved-boats',
    {
      preHandler: validate({ body: saveBoatBodySchema }),
      schema: { tags: ['Saved Boats'], description: 'Save a boat to watchlist' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof saveBoatBodySchema>;
      const result = await userService.saveBoat(getUserId(request), body.listingId, body.notes);
      return reply.status(201).send({ success: true, data: result });
    },
  );

  server.delete(
    '/api/v1/users/me/saved-boats/:id',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Saved Boats'], description: 'Remove a saved boat' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      await userService.removeSavedBoat(getUserId(request), id);
      return reply.status(204).send();
    },
  );

  // -- Search Alerts --

  server.get(
    '/api/v1/users/me/alerts',
    { schema: { tags: ['Alerts'], description: 'Get search alerts' } },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const alerts = await userService.getAlerts(getUserId(request));
      return { success: true, data: alerts };
    },
  );

  server.post(
    '/api/v1/users/me/alerts',
    {
      preHandler: validate({ body: createAlertBodySchema }),
      schema: { tags: ['Alerts'], description: 'Create a search alert' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof createAlertBodySchema>;
      const alert = await userService.createAlert(getUserId(request), body);
      return reply.status(201).send({ success: true, data: alert });
    },
  );

  server.put(
    '/api/v1/users/me/alerts/:id',
    {
      preHandler: validate({ params: idParamSchema, body: updateAlertBodySchema }),
      schema: { tags: ['Alerts'], description: 'Update a search alert' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const body = request.body as z.infer<typeof updateAlertBodySchema>;
      const alert = await userService.updateAlert(getUserId(request), id, body);
      return { success: true, data: alert };
    },
  );

  server.delete(
    '/api/v1/users/me/alerts/:id',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Alerts'], description: 'Delete a search alert' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      await userService.deleteAlert(getUserId(request), id);
      return reply.status(204).send();
    },
  );
}

export default fp(userRoutes, {
  name: 'user-routes',
  fastify: '5.x',
});
