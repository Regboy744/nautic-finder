import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Database } from '../../shared/db/client.js';
import { createServiceLogger } from '../../shared/logger/index.js';
import {
  createListingsRepository,
  createModelsRepository,
  createBrokersRepository,
  createPriceHistoryRepository,
  createMarketStatsRepository,
} from './repositories/index.js';
import { createListingsService, createModelsService } from './services/index.js';
import catalogRoutes from './routes.js';

/** Options for the catalog plugin. */
export interface CatalogPluginOptions {
  db: Database['db'];
}

/**
 * Catalog service plugin — assembles repositories, services, and routes.
 * Register this as a Fastify plugin from server.ts.
 */
async function catalogPlugin(server: FastifyInstance, opts: CatalogPluginOptions): Promise<void> {
  const { db } = opts;
  const log = createServiceLogger('catalog');

  // Build repositories
  const listingsRepo = createListingsRepository(db);
  const modelsRepo = createModelsRepository(db);
  const brokersRepo = createBrokersRepository(db);
  const priceHistoryRepo = createPriceHistoryRepository(db);
  const marketStatsRepo = createMarketStatsRepository(db);

  // Build services
  const listingsService = createListingsService({
    listingsRepo,
    priceHistoryRepo,
    modelsRepo,
    log,
  });

  const modelsService = createModelsService({ modelsRepo, log });

  // Register routes
  await server.register(catalogRoutes, {
    listingsService,
    modelsService,
    brokersRepo,
    marketStatsRepo,
  });

  log.info('Catalog service registered');
}

export default fp(catalogPlugin, {
  name: 'catalog',
  fastify: '5.x',
});
