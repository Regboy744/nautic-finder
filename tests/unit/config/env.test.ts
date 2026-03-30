import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../../src/config/env.js';

/** Minimal valid env vars for loadConfig to succeed */
const validEnv: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3000',
  LOG_LEVEL: 'info',
  CORS_ORIGIN: 'http://localhost:3001',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/nauticfinder',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REDIS_URL: 'redis://localhost:6379',
  GEMINI_API_KEY: 'test-gemini-key',
  JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
  SCRAPER_USER_AGENT: 'NauticFinder/1.0',
};

describe('loadConfig', () => {
  it('parses valid environment variables successfully', () => {
    const config = loadConfig(validEnv);

    expect(config.app.nodeEnv).toBe('test');
    expect(config.app.port).toBe(3000);
    expect(config.app.isTest).toBe(true);
    expect(config.app.isProduction).toBe(false);
    expect(config.database.url).toBe(validEnv.DATABASE_URL);
    expect(config.database.supabaseUrl).toBe(validEnv.SUPABASE_URL);
    expect(config.redis.url).toBe(validEnv.REDIS_URL);
    expect(config.ai.geminiApiKey).toBe(validEnv.GEMINI_API_KEY);
    expect(config.auth.jwtSecret).toBe(validEnv.JWT_SECRET);
  });

  it('throws when DATABASE_URL is missing', () => {
    const env = { ...validEnv };
    delete env.DATABASE_URL;

    expect(() => loadConfig(env)).toThrow('DATABASE_URL');
  });

  it('throws when SUPABASE_URL is not a valid URL', () => {
    const env = { ...validEnv, SUPABASE_URL: 'not-a-url' };

    expect(() => loadConfig(env)).toThrow('SUPABASE_URL');
  });

  it('throws when JWT_SECRET is too short', () => {
    const env = { ...validEnv, JWT_SECRET: 'short' };

    expect(() => loadConfig(env)).toThrow('JWT_SECRET');
  });

  it('throws when GEMINI_API_KEY is missing', () => {
    const env = { ...validEnv };
    delete env.GEMINI_API_KEY;

    expect(() => loadConfig(env)).toThrow('GEMINI_API_KEY');
  });

  it('applies defaults for optional fields', () => {
    const config = loadConfig(validEnv);

    expect(config.ai.anthropicApiKey).toBe('');
    expect(config.ai.openaiApiKey).toBe('');
    expect(config.scraping.proxyUrl).toBe('');
    expect(config.scraping.concurrency).toBe(3);
    expect(config.notification.resendApiKey).toBe('');
    expect(config.redis.keyPrefix).toBe('nf:');
    expect(config.currency.exchangeRateApiKey).toBe('');
    expect(config.currency.cacheTtlSeconds).toBe(21_600);
  });

  it('coerces PORT from string to number', () => {
    const env = { ...validEnv, PORT: '8080' };
    const config = loadConfig(env);

    expect(config.app.port).toBe(8080);
    expect(typeof config.app.port).toBe('number');
  });

  it('rejects invalid NODE_ENV values', () => {
    const env = { ...validEnv, NODE_ENV: 'staging' };

    expect(() => loadConfig(env)).toThrow();
  });

  it('rejects invalid LOG_LEVEL values', () => {
    const env = { ...validEnv, LOG_LEVEL: 'verbose' };

    expect(() => loadConfig(env)).toThrow();
  });

  it('correctly sets boolean flags based on NODE_ENV', () => {
    const prodConfig = loadConfig({ ...validEnv, NODE_ENV: 'production' });
    expect(prodConfig.app.isProduction).toBe(true);
    expect(prodConfig.app.isDevelopment).toBe(false);
    expect(prodConfig.app.isTest).toBe(false);

    const devConfig = loadConfig({ ...validEnv, NODE_ENV: 'development' });
    expect(devConfig.app.isDevelopment).toBe(true);
    expect(devConfig.app.isProduction).toBe(false);
  });
});
