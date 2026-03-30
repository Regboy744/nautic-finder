import { createServer } from '../../src/server.js';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../../src/config/env.js';

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
      ...overrides?.scraping,
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
 * Creates a Fastify test server instance. Call `server.close()` in afterAll/afterEach.
 */
export async function createTestServer(
  configOverrides?: Partial<AppConfig>,
): Promise<FastifyInstance> {
  const config = createTestConfig(configOverrides);
  const server = await createServer({ config });
  await server.ready();
  return server;
}
