import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { type AppConfig } from './config/env.js';

/** Options for creating the Fastify application */
export interface CreateServerOptions {
  config: AppConfig;
}

/**
 * Creates and configures the Fastify server instance.
 * Registers all plugins, middleware, and routes.
 * Does NOT start listening — call `server.listen()` separately.
 */
export async function createServer({ config }: CreateServerOptions): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: config.app.logLevel,
      transport: config.app.isDevelopment
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
    },
    genReqId: () => crypto.randomUUID(),
    disableRequestLogging: config.app.isTest,
  });

  // --- Security & CORS ---
  await server.register(helmet, {
    contentSecurityPolicy: false, // Disabled for Swagger UI compatibility
  });

  await server.register(cors, {
    origin: config.app.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // --- Rate Limiting ---
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.ip;
    },
  });

  // --- API Documentation ---
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'NauticFinder API',
        description: 'AI-powered nautical search and discovery platform',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://localhost:${config.app.port}`,
          description: 'Local development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // --- Health Check ---
  server.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
    handler: async (_request, _reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        uptime: process.uptime(),
      };
    },
  });

  // --- Graceful Shutdown ---
  const shutdownHandlers: Array<() => Promise<void>> = [];

  /**
   * Registers a function to be called during graceful shutdown.
   * Use this for closing DB connections, Redis, BullMQ workers, etc.
   */
  server.decorate('addShutdownHandler', (handler: () => Promise<void>) => {
    shutdownHandlers.push(handler);
  });

  server.addHook('onClose', async () => {
    server.log.info('Running shutdown handlers...');
    for (const handler of shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        server.log.error(error, 'Shutdown handler failed');
      }
    }
  });

  return server;
}

// --- Type augmentation for custom decorators ---
declare module 'fastify' {
  interface FastifyInstance {
    addShutdownHandler: (handler: () => Promise<void>) => void;
  }
}
