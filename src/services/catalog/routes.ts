import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { z } from 'zod';
import { validate } from '../../gateway/middleware/validate.js';
import {
  idParamSchema,
  listingsQuerySchema,
  upsertListingBodySchema,
  updateListingBodySchema,
  modelsQuerySchema,
  createModelBodySchema,
  updateModelBodySchema,
} from './schemas.js';
import type { ListingsService } from './services/listings.service.js';
import type { ModelsService } from './services/models.service.js';
import type { BrokersRepository } from './repositories/brokers.repository.js';
import type { MarketStatsRepository } from './repositories/market-stats.repository.js';

/** Catalog plugin options — injected services and repositories. */
export interface CatalogRoutesOptions {
  listingsService: ListingsService;
  modelsService: ModelsService;
  brokersRepo: BrokersRepository;
  marketStatsRepo: MarketStatsRepository;
}

/**
 * Catalog routes plugin — registers all /api/v1 catalog endpoints.
 */
function catalogRoutes(server: FastifyInstance, opts: CatalogRoutesOptions): void {
  const { listingsService, modelsService, brokersRepo, marketStatsRepo } = opts;

  // =========================================================================
  // PUBLIC — Listings
  // =========================================================================

  /** GET /api/v1/listings — paginated, filtered listings. */
  server.get(
    '/api/v1/listings',
    {
      preHandler: validate({ querystring: listingsQuerySchema }),
      schema: { tags: ['Listings'], description: 'List boat listings with filters' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const query = request.query as z.infer<typeof listingsQuerySchema>;
      return listingsService.list(
        {
          boatType: query.boatType,
          make: query.make,
          model: query.model,
          yearMin: query.yearMin,
          yearMax: query.yearMax,
          priceMin: query.priceMin,
          priceMax: query.priceMax,
          country: query.country,
          region: query.region,
          lengthMinFt: query.lengthMinFt,
          lengthMaxFt: query.lengthMaxFt,
          hullMaterial: query.hullMaterial,
          fuelType: query.fuelType,
          isActive: query.isActive,
        },
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortDirection: query.sortDirection,
        },
      );
    },
  );

  /** GET /api/v1/listings/:id — single listing with model data. */
  server.get(
    '/api/v1/listings/:id',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Listings'], description: 'Get a listing by ID with model data' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const listing = await listingsService.getById(id);
      return { success: true, data: listing };
    },
  );

  /** GET /api/v1/listings/:id/price-history — price change log. */
  server.get(
    '/api/v1/listings/:id/price-history',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Listings'], description: 'Get price history for a listing' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const history = await listingsService.getPriceHistory(id);
      return { success: true, data: history };
    },
  );

  /** GET /api/v1/listings/:id/similar — similar listings. */
  server.get(
    '/api/v1/listings/:id/similar',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Listings'], description: 'Find similar listings' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const similar = await listingsService.getSimilar(id);
      return { success: true, data: similar };
    },
  );

  // =========================================================================
  // PUBLIC — Models
  // =========================================================================

  /** GET /api/v1/models — paginated models. */
  server.get(
    '/api/v1/models',
    {
      preHandler: validate({ querystring: modelsQuerySchema }),
      schema: { tags: ['Models'], description: 'List boat models' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const query = request.query as z.infer<typeof modelsQuerySchema>;
      return modelsService.list(
        { make: query.make, boatType: query.boatType },
        { page: query.page, limit: query.limit },
      );
    },
  );

  /** GET /api/v1/models/:id — single model. */
  server.get(
    '/api/v1/models/:id',
    {
      preHandler: validate({ params: idParamSchema }),
      schema: { tags: ['Models'], description: 'Get a boat model by ID' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const model = await modelsService.getById(id);
      return { success: true, data: model };
    },
  );

  // =========================================================================
  // PUBLIC — Brokers
  // =========================================================================

  /** GET /api/v1/brokers — all active brokers. */
  server.get(
    '/api/v1/brokers',
    { schema: { tags: ['Brokers'], description: 'List active brokers' } },
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      const brokersList = await brokersRepo.findActive();
      return { success: true, data: brokersList };
    },
  );

  // =========================================================================
  // PUBLIC — Market Stats
  // =========================================================================

  /** GET /api/v1/market-stats — aggregated pricing data. */
  server.get(
    '/api/v1/market-stats',
    { schema: { tags: ['Market Stats'], description: 'Get aggregated market statistics' } },
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      const stats = await marketStatsRepo.findAll();
      return { success: true, data: stats };
    },
  );

  // =========================================================================
  // INTERNAL — Listings (for scraper)
  // =========================================================================

  /** POST /api/v1/internal/listings — upsert a listing from scraper. */
  server.post(
    '/api/v1/internal/listings',
    {
      preHandler: validate({ body: upsertListingBodySchema }),
      schema: { tags: ['Internal'], description: 'Upsert a listing (scraper)' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof upsertListingBodySchema>;
      const { listing, isNew } = await listingsService.upsert(body);
      return reply.status(isNew ? 201 : 200).send({ success: true, data: listing, isNew });
    },
  );

  /** PUT /api/v1/internal/listings/:id — update a listing. */
  server.put(
    '/api/v1/internal/listings/:id',
    {
      preHandler: validate({ params: idParamSchema, body: updateListingBodySchema }),
      schema: { tags: ['Internal'], description: 'Update a listing (scraper)' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const body = request.body as z.infer<typeof updateListingBodySchema>;
      const listing = await listingsService.update(id, body);
      return { success: true, data: listing };
    },
  );

  // =========================================================================
  // INTERNAL — Models
  // =========================================================================

  /** POST /api/v1/internal/models — create a model. */
  server.post(
    '/api/v1/internal/models',
    {
      preHandler: validate({ body: createModelBodySchema }),
      schema: { tags: ['Internal'], description: 'Create a boat model' },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof createModelBodySchema>;
      const model = await modelsService.create(body);
      return reply.status(201).send({ success: true, data: model });
    },
  );

  /** PUT /api/v1/internal/models/:id — update a model. */
  server.put(
    '/api/v1/internal/models/:id',
    {
      preHandler: validate({ params: idParamSchema, body: updateModelBodySchema }),
      schema: { tags: ['Internal'], description: 'Update a boat model' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as z.infer<typeof idParamSchema>;
      const body = request.body as z.infer<typeof updateModelBodySchema>;
      const model = await modelsService.update(id, body);
      return { success: true, data: model };
    },
  );
}

export default fp(catalogRoutes, {
  name: 'catalog-routes',
  fastify: '5.x',
});
