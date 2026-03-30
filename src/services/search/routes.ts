import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { z } from 'zod';
import { validate } from '../../gateway/middleware/validate.js';
import { searchBodySchema, semanticSearchBodySchema } from './schemas.js';
import type { SearchService } from './search.service.js';

/** Search routes plugin options. */
export interface SearchRoutesOptions {
  searchService: SearchService;
}

/**
 * Search routes plugin — registers /api/v1/search endpoints.
 */
function searchRoutes(server: FastifyInstance, opts: SearchRoutesOptions): void {
  const { searchService } = opts;

  /**
   * POST /api/v1/search — filter-based search.
   * Returns scored, paginated results.
   */
  server.post(
    '/api/v1/search',
    {
      preHandler: validate({ body: searchBodySchema }),
      schema: { tags: ['Search'], description: 'Search listings with filters' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const body = request.body as z.infer<typeof searchBodySchema>;
      return searchService.search({
        filters: body.filters,
        page: body.page,
        limit: body.limit,
      });
    },
  );

  /**
   * POST /api/v1/search/semantic — semantic search with embedding.
   * The query string will be embedded by the AI service (Branch 7).
   * For now, this endpoint accepts the query but performs filter-only search.
   * Full semantic search is wired up after the AI service is built.
   */
  server.post(
    '/api/v1/search/semantic',
    {
      preHandler: validate({ body: semanticSearchBodySchema }),
      schema: { tags: ['Search'], description: 'Semantic search with natural language' },
    },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const body = request.body as z.infer<typeof semanticSearchBodySchema>;

      // TODO: In Branch 7 (AI service), the query will be embedded here
      // For now, perform filter-only search
      request.log.info({ query: body.query }, 'Semantic search (embedding pending AI service)');

      return searchService.search({
        filters: body.filters,
        page: body.page,
        limit: body.limit,
        // embedding will be passed here after AI service is built
      });
    },
  );

  /**
   * GET /api/v1/search/suggestions — popular makes, types, countries.
   */
  server.get(
    '/api/v1/search/suggestions',
    {
      schema: {
        tags: ['Search'],
        description: 'Get search suggestions (popular makes, types, countries)',
      },
    },
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      const suggestions = await searchService.getSuggestions();
      return { success: true, data: suggestions };
    },
  );
}

export default fp(searchRoutes, {
  name: 'search-routes',
  fastify: '5.x',
});
