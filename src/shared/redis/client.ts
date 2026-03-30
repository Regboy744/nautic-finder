import Redis, { type RedisOptions } from 'ioredis';
import type { Logger } from 'pino';
import { createServiceLogger } from '../logger/index.js';

/** Lazy-initialized logger to avoid requiring logger init at import time. */
let log: Logger;
function getLog(): Logger {
  if (!log) log = createServiceLogger('redis');
  return log;
}

/** Redis client singleton. */
let redisClient: Redis | null = null;

/** Configuration for the Redis client. */
export interface RedisConfig {
  url: string;
  /** Max reconnect attempts before giving up. Default: 10. */
  maxRetriesPerRequest?: number;
  /** Key prefix for all operations. Default: 'nf:'. */
  keyPrefix?: string;
}

/**
 * Creates and returns the Redis client singleton.
 * Idempotent — returns existing client if already created.
 * Registers event handlers for logging connection state.
 */
export function createRedisClient(config: RedisConfig): Redis {
  if (redisClient) return redisClient;

  const options: RedisOptions = {
    maxRetriesPerRequest: config.maxRetriesPerRequest ?? 10,
    keyPrefix: config.keyPrefix ?? 'nf:',
    retryStrategy(times: number) {
      // Exponential backoff: 50ms, 100ms, 200ms, ... max 5s
      const delay = Math.min(times * 50, 5_000);
      getLog().warn({ attempt: times, delayMs: delay }, 'Redis reconnecting');
      return delay;
    },
    // Don't throw on connection errors (we handle via events)
    lazyConnect: true,
  };

  redisClient = new Redis(config.url, options);

  redisClient.on('connect', () => {
    getLog().info('Redis connected');
  });

  redisClient.on('ready', () => {
    getLog().info('Redis ready');
  });

  redisClient.on('error', (err: Error) => {
    getLog().error({ err }, 'Redis error');
  });

  redisClient.on('close', () => {
    getLog().warn('Redis connection closed');
  });

  redisClient.on('reconnecting', () => {
    getLog().info('Redis reconnecting...');
  });

  return redisClient;
}

/**
 * Returns the existing Redis client. Throws if not yet created.
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redisClient;
}

/**
 * Checks if Redis is reachable by sending a PING command.
 * Returns true if PONG is received within 2 seconds.
 */
export async function checkRedisHealth(): Promise<boolean> {
  if (!redisClient) return false;

  try {
    const result = await Promise.race([
      redisClient.ping(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Redis health check timed out')), 2_000),
      ),
    ]);
    return result === 'PONG';
  } catch (err) {
    getLog().error({ err }, 'Redis health check failed');
    return false;
  }
}

/**
 * Gracefully disconnects the Redis client.
 * Resolves after the connection is fully closed.
 */
export async function disconnectRedis(): Promise<void> {
  if (!redisClient) return;

  try {
    await redisClient.quit();
    getLog().info('Redis disconnected gracefully');
  } catch (err) {
    getLog().error({ err }, 'Redis disconnect error, forcing close');
    redisClient.disconnect();
  } finally {
    redisClient = null;
  }
}

/**
 * Resets the Redis singleton. Only for testing — never call in production.
 * Does NOT disconnect; call `disconnectRedis()` first if needed.
 * @internal
 */
export function resetRedisClient(): void {
  redisClient = null;
}
