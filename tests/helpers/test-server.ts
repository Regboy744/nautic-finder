import { createServer, type CreateServerOptions } from '../../src/server.js';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../../src/config/env.js';
import { resetLogger } from '../../src/shared/logger/index.js';

/**
 * Builds a minimal valid AppConfig for testing.
 * Override any section by passing partial config.
 */
export function createTestConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    app: {
      nodeEnv: 'test',
      port: 0, // Random port
      logLevel: 'silent',
      corsOrigin: 'http://localhost:3001',
      isProduction: false,
      isDevelopment: false,
      isTest: true,
      ...overrides?.app,
    },
    database: {
      url: 'postgresql://postgres:postgres@localhost:5432/nauticfinder_test',
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
      supabaseServiceRoleKey: 'test-service-role-key',
      ...overrides?.database,
    },
    redis: {
      url: 'redis://localhost:6379',
      keyPrefix: 'nf-test:',
      ...overrides?.redis,
    },
    ai: {
      geminiApiKey: 'test-gemini-key',
      anthropicApiKey: '',
      openaiApiKey: '',
      ...overrides?.ai,
    },
    scraping: {
      proxyUrl: '',
      userAgent: 'NauticFinder/1.0-test',
      concurrency: 1,
      ...overrides?.scraping,
    },
    currency: {
      exchangeRateApiKey: '',
      cacheTtlSeconds: 3600,
      ...overrides?.currency,
    },
    notification: {
      resendApiKey: '',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      ...overrides?.notification,
    },
    auth: {
      jwtSecret: 'test-jwt-secret-at-least-32-characters-long',
      ...overrides?.auth,
    },
  };
}

/**
 * Creates a Fastify test server instance ready for injection.
 * Call `server.close()` in afterAll/afterEach.
 * Skips Redis by default in tests to avoid needing a running Redis instance.
 */
export async function createTestServer(
  configOverrides?: Partial<AppConfig>,
  serverOptions?: Partial<Omit<CreateServerOptions, 'config'>>,
): Promise<FastifyInstance> {
  // Reset logger singleton between test suites so initLogger works fresh
  resetLogger();

  const config = createTestConfig(configOverrides);
  const server = await createServer({
    config,
    skipRedis: true,
    ...serverOptions,
  });
  await server.ready();
  return server;
}

/**
 * Creates a Fastify test server WITHOUT calling `.ready()`.
 * Use this when you need to register routes/plugins in the test before injecting.
 * Call `await server.ready()` yourself after registering routes.
 */
export async function createRawTestServer(
  configOverrides?: Partial<AppConfig>,
  serverOptions?: Partial<Omit<CreateServerOptions, 'config'>>,
): Promise<FastifyInstance> {
  resetLogger();

  const config = createTestConfig(configOverrides);
  return createServer({
    config,
    skipRedis: true,
    ...serverOptions,
  });
}
