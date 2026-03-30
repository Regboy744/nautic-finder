/**
 * Rate limiting configurations for different endpoint groups.
 * The base rate limiter is already registered in server.ts (100 req/min).
 * These configs are for route-specific overrides using Fastify's config option.
 */

import type { RateLimitOptions } from '@fastify/rate-limit';

/**
 * Strict rate limit for authentication endpoints (login, register).
 * Prevents brute-force attacks.
 */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  max: 10,
  timeWindow: '15 minutes',
};

/**
 * Rate limit for AI-powered endpoints (chat, reasoning).
 * More restrictive due to API cost.
 */
export const AI_RATE_LIMIT: RateLimitOptions = {
  max: 30,
  timeWindow: '1 minute',
};

/**
 * Rate limit for search endpoints.
 * Moderate — higher than AI but lower than general API.
 */
export const SEARCH_RATE_LIMIT: RateLimitOptions = {
  max: 60,
  timeWindow: '1 minute',
};

/**
 * Rate limit for internal/admin endpoints (scraper ingestion).
 * Very permissive since these are server-to-server.
 */
export const INTERNAL_RATE_LIMIT: RateLimitOptions = {
  max: 500,
  timeWindow: '1 minute',
};
