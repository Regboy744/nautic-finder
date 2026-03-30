import type { Logger } from 'pino';
import { REDIS_KEYS } from '../constants/index.js';
import { createServiceLogger } from '../logger/index.js';
import { ExternalServiceError } from '../errors/index.js';

/** Lazy-initialized logger to avoid requiring logger init at import time. */
let log: Logger;
function getLog(): Logger {
  if (!log) log = createServiceLogger('currency');
  return log;
}

/**
 * Cached exchange rates stored in Redis.
 * Rates are relative to EUR (e.g., { USD: 1.08, GBP: 0.86 }).
 */
interface ExchangeRates {
  base: 'EUR';
  rates: Record<string, number>;
  fetchedAt: string;
}

/**
 * Fetches exchange rates from the ExchangeRate-API (free tier).
 * Falls back to hardcoded fallback rates if the API is unavailable.
 */
async function fetchRatesFromApi(apiKey: string): Promise<Record<string, number>> {
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/EUR`
    : 'https://open.er-api.com/v6/latest/EUR';

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new ExternalServiceError(
      'exchange-rate-api',
      `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    result?: string;
    conversion_rates?: Record<string, number>;
    rates?: Record<string, number>;
  };

  // exchangerate-api.com format
  if (data.conversion_rates) return data.conversion_rates;
  // open.er-api.com format
  if (data.rates) return data.rates;

  throw new ExternalServiceError('exchange-rate-api', 'Unexpected response format');
}

/**
 * Hardcoded fallback rates (EUR base) for when the API is unreachable.
 * Updated periodically — not for production accuracy.
 */
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.97,
  SEK: 11.5,
  NOK: 11.7,
  DKK: 7.46,
  AUD: 1.67,
  NZD: 1.81,
  CAD: 1.48,
};

/** Options for the currency converter. */
export interface CurrencyConverterOptions {
  exchangeRateApiKey: string;
  cacheTtlSeconds: number;
  /** Redis client (optional — if absent, rates are not cached). */
  redis?: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, expiryMode: string, ttl: number): Promise<unknown>;
  };
}

/**
 * Creates a currency converter with Redis-backed rate caching.
 *
 * @example
 * const converter = createCurrencyConverter({ exchangeRateApiKey: '...', cacheTtlSeconds: 21600, redis });
 * const usd = await converter.convert(100, 'EUR', 'USD'); // 108
 */
export function createCurrencyConverter(options: CurrencyConverterOptions) {
  const { exchangeRateApiKey, cacheTtlSeconds, redis } = options;
  const cacheKey = `${REDIS_KEYS.EXCHANGE_RATE}rates`;

  /**
   * Gets exchange rates — from Redis cache first, then API, then fallback.
   */
  async function getRates(): Promise<Record<string, number>> {
    // 1. Try Redis cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as ExchangeRates;
          return parsed.rates;
        }
      } catch (err) {
        getLog().warn({ err }, 'Failed to read exchange rates from cache');
      }
    }

    // 2. Try API
    try {
      const rates = await fetchRatesFromApi(exchangeRateApiKey);

      // Cache the rates
      if (redis) {
        const payload: ExchangeRates = {
          base: 'EUR',
          rates,
          fetchedAt: new Date().toISOString(),
        };
        try {
          await redis.set(cacheKey, JSON.stringify(payload), 'EX', cacheTtlSeconds);
        } catch (err) {
          getLog().warn({ err }, 'Failed to cache exchange rates');
        }
      }

      return rates;
    } catch (err) {
      getLog().error({ err }, 'Failed to fetch exchange rates, using fallback');
      return FALLBACK_RATES;
    }
  }

  /**
   * Converts an amount from one currency to another.
   * Returns null if either currency is not supported.
   */
  async function convert(amount: number, from: string, to: string): Promise<number | null> {
    if (from === to) return amount;

    const rates = await getRates();
    const fromRate = rates[from];
    const toRate = rates[to];

    if (fromRate === undefined || fromRate === null || toRate === undefined || toRate === null) {
      getLog().warn({ from, to }, 'Unsupported currency pair');
      return null;
    }

    // Convert via EUR base: amount / fromRate * toRate
    const result = (amount / fromRate) * toRate;
    return Math.round(result * 100) / 100;
  }

  /**
   * Normalizes a price to both EUR and USD.
   * Returns { eur, usd } or null values if conversion fails.
   */
  async function normalizePrice(
    amount: number,
    fromCurrency: string,
  ): Promise<{ eur: number | null; usd: number | null }> {
    const [eur, usd] = await Promise.all([
      convert(amount, fromCurrency, 'EUR'),
      convert(amount, fromCurrency, 'USD'),
    ]);
    return { eur, usd };
  }

  return { convert, normalizePrice, getRates };
}

/** Type of the currency converter returned by createCurrencyConverter. */
export type CurrencyConverter = ReturnType<typeof createCurrencyConverter>;
