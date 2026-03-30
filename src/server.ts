import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { type AppConfig } from './config/env.js';
import { initLogger } from './shared/logger/index.js';
import { createRedisClient, checkRedisHealth, disconnectRedis } from './shared/redis/client.js';
import { errorHandlerPlugin, requestIdPlugin, authPlugin } from './gateway/middleware/index.js';

/** Options for creating the Fastify application */
export interface CreateServerOptions {
  config: AppConfig;
  /** Skip Redis connection (useful for tests that don't need it). */
  skipRedis?: boolean;
}

/**
 * Creates and configures the Fastify server instance.
 * Registers all plugins, middleware, and routes.
 * Does NOT start listening — call `server.listen()` separately.
 */
export async function createServer({
  config,
  skipRedis,
}: CreateServerOptions): Promise<FastifyInstance> {
  // Initialize the shared Pino logger singleton (used by service loggers)
  initLogger({
    level: config.app.logLevel,
    isDevelopment: config.app.isDevelopment,
  });

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

  // --- Gateway Middleware (order matters) ---

  // 1. Request-ID propagation (adds X-Request-ID to responses)
  await server.register(requestIdPlugin);

  // 2. Error handler (catches all errors, returns consistent JSON)
  await server.register(errorHandlerPlugin);

  // 3. Security & CORS
  await server.register(helmet, {
    contentSecurityPolicy: false, // Disabled for Swagger UI compatibility
  });

  await server.register(cors, {
    origin: config.app.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // 4. Rate Limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.ip;
    },
  });

  // 5. Auth (Supabase JWT verification — decorates server.authenticate)
  await server.register(authPlugin, {
    supabaseUrl: config.database.supabaseUrl,
    jwtSecret: config.auth.jwtSecret,
  });

  // --- Redis ---
  if (!skipRedis) {
    const redis = createRedisClient({
      url: config.redis.url,
      keyPrefix: config.redis.keyPrefix,
    });

    // Connect Redis (lazy connect mode)
    try {
      await redis.connect();
    } catch (err) {
      server.log.error({ err }, 'Redis initial connection failed — continuing without cache');
    }
  }

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
            redis: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, _reply) => {
      const redisHealthy = skipRedis ? null : await checkRedisHealth();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        uptime: process.uptime(),
        redis: skipRedis ? 'skipped' : redisHealthy ? 'connected' : 'disconnected',
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

  // Register Redis shutdown
  if (!skipRedis) {
    shutdownHandlers.push(disconnectRedis);
  }

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

  // Store config on the server for access by plugins/services
  server.decorate('config', config);

  return server;
}

// --- Type augmentation for custom decorators ---
declare module 'fastify' {
  interface FastifyInstance {
    addShutdownHandler: (handler: () => Promise<void>) => void;
    config: AppConfig;
  }
}
