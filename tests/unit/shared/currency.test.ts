import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initLogger, resetLogger } from '../../../src/shared/logger/index.js';
import { createCurrencyConverter } from '../../../src/shared/utils/currency.js';

// Initialize logger for currency service logger
beforeEach(() => {
  resetLogger();
  initLogger({ level: 'silent', isDevelopment: false });
});

describe('createCurrencyConverter', () => {
  describe('convert (with fallback rates)', () => {
    it('returns the same amount when from === to', async () => {
      const converter = createCurrencyConverter({
        exchangeRateApiKey: '',
        cacheTtlSeconds: 3600,
      });

      const result = await converter.convert(100, 'EUR', 'EUR');
      expect(result).toBe(100);
    });

    it('converts EUR to USD using fallback rates', async () => {
      // Mock fetch to fail so we use fallback rates
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

      const converter = createCurrencyConverter({
        exchangeRateApiKey: '',
        cacheTtlSeconds: 3600,
      });

      const result = await converter.convert(100, 'EUR', 'USD');
      expect(result).not.toBeNull();
      expect(result).toBe(108); // fallback rate: 1.08
    });

    it('converts USD to EUR using fallback rates', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

      const converter = createCurrencyConverter({
        exchangeRateApiKey: '',
        cacheTtlSeconds: 3600,
      });

      const result = await converter.convert(108, 'USD', 'EUR');
      expect(result).not.toBeNull();
      expect(result).toBe(100); // 108 / 1.08 * 1 = 100
    });

    it('returns null for unsupported currency', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

      const converter = createCurrencyConverter({
        exchangeRateApiKey: '',
        cacheTtlSeconds: 3600,
      });

      const result = await converter.convert(100, 'EUR', 'XYZ');
      expect(result).toBeNull();
    });
  });

  describe('normalizePrice', () => {
    it('returns both EUR and USD normalized values', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

      const converter = createCurrencyConverter({
        exchangeRateApiKey: '',
        cacheTtlSeconds: 3600,
      });

      const result = await converter.normalizePrice(100, 'EUR');

      expect(result.eur).toBe(100);
      expect(result.usd).toBe(108);
    });

    it('converts from GBP to both EUR and USD', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

      const converter = createCurrencyConverter({
        exchangeRateApiKey: '',
        cacheTtlSeconds: 3600,
      });

      const result = await converter.normalizePrice(100, 'GBP');

      // GBP fallback rate is 0.86 (per 1 EUR)
      // 100 GBP = 100 / 0.86 EUR = ~116.28 EUR
      // 100 GBP = 100 / 0.86 * 1.08 USD = ~125.58 USD
      expect(result.eur).not.toBeNull();
      expect(result.usd).not.toBeNull();
      expect(result.eur!).toBeGreaterThan(100); // GBP is worth more than EUR
    });
  });

  describe('getRates (with Redis cache)', () => {
    it('uses cached rates from Redis when available', async () => {
      const cachedRates = {
        base: 'EUR',
        rates: { EUR: 1, USD: 1.1, GBP: 0.85 },
        fetchedAt: new Date().toISOString(),
      };

      const mockRedis = {
        get: vi.fn().mockResolvedValue(JSON.stringify(cachedRates)),
        set: vi.fn().mockResolvedValue('OK'),
      };

      const converter = createCurrencyConverter({
        exchangeRateApiKey: '',
        cacheTtlSeconds: 3600,
        redis: mockRedis,
      });

      const rates = await converter.getRates();

      expect(rates.USD).toBe(1.1);
      expect(rates.GBP).toBe(0.85);
      expect(mockRedis.get).toHaveBeenCalledOnce();
    });
  });
});
