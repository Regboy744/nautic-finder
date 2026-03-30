import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Database } from '../../shared/db/client.js';
import { createServiceLogger } from '../../shared/logger/index.js';
import { createUsersRepository } from './repositories/users.repository.js';
import { createSavedBoatsRepository } from './repositories/saved-boats.repository.js';
import { createSearchAlertsRepository } from './repositories/search-alerts.repository.js';
import { createUserService } from './user.service.js';
import userRoutes from './routes.js';

export interface UserPluginOptions {
  db: Database['db'];
}

async function userPlugin(server: FastifyInstance, opts: UserPluginOptions): Promise<void> {
  const log = createServiceLogger('user');

  const usersRepo = createUsersRepository(opts.db);
  const savedBoatsRepo = createSavedBoatsRepository(opts.db);
  const alertsRepo = createSearchAlertsRepository(opts.db);

  const userService = createUserService({ usersRepo, savedBoatsRepo, alertsRepo, log });

  await server.register(userRoutes, { userService });

  log.info('User service registered');
}

export default fp(userPlugin, {
  name: 'user',
  fastify: '5.x',
});
