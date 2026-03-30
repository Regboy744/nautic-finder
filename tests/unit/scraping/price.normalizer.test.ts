import { describe, it, expect } from 'vitest';
import { normalizePrice } from '../../../src/scraping/normalizers/price.normalizer.js';

describe('normalizePrice', () => {
  it('handles null/undefined/empty', () => {
    expect(normalizePrice(null)).toEqual({ price: null, currency: null });
    expect(normalizePrice(undefined)).toEqual({ price: null, currency: null });
    expect(normalizePrice('')).toEqual({ price: null, currency: null });
  });

  it('detects EUR symbol and extracts price', () => {
    expect(normalizePrice('€85,000')).toEqual({ price: '85000', currency: 'EUR' });
    expect(normalizePrice('€ 85,000')).toEqual({ price: '85000', currency: 'EUR' });
    expect(normalizePrice('85.000 €')).toEqual({ price: '85000', currency: 'EUR' });
  });

  it('detects USD symbol', () => {
    expect(normalizePrice('$92,500')).toEqual({ price: '92500', currency: 'USD' });
    expect(normalizePrice('$92500')).toEqual({ price: '92500', currency: 'USD' });
  });

  it('detects GBP symbol', () => {
    expect(normalizePrice('£75,000')).toEqual({ price: '75000', currency: 'GBP' });
  });

  it('detects currency codes', () => {
    expect(normalizePrice('85000 EUR')).toEqual({ price: '85000', currency: 'EUR' });
    expect(normalizePrice('USD 92,500')).toEqual({ price: '92500', currency: 'USD' });
    expect(normalizePrice('CHF 120000')).toEqual({ price: '120000', currency: 'CHF' });
  });

  it('handles European format (dot as thousands)', () => {
    expect(normalizePrice('85.000 EUR')).toEqual({ price: '85000', currency: 'EUR' });
    expect(normalizePrice('€1.250.000')).toEqual({ price: '1250000', currency: 'EUR' });
  });

  it('handles European format (comma as decimal)', () => {
    expect(normalizePrice('€85.000,50')).toEqual({ price: '85001', currency: 'EUR' });
  });

  it('handles Swiss format (apostrophe as thousands)', () => {
    expect(normalizePrice("CHF 120'000")).toEqual({ price: '120000', currency: 'CHF' });
  });

  it('handles multiplier suffixes', () => {
    expect(normalizePrice('$92K')).toEqual({ price: '92000', currency: 'USD' });
    expect(normalizePrice('€1.2M')).toEqual({ price: '1200000', currency: 'EUR' });
    expect(normalizePrice('$850k')).toEqual({ price: '850000', currency: 'USD' });
  });

  it('handles space as thousands separator', () => {
    expect(normalizePrice('85 000 EUR')).toEqual({ price: '85000', currency: 'EUR' });
  });

  it('returns null for POA / Price on Application', () => {
    expect(normalizePrice('POA')).toEqual({ price: null, currency: null });
    expect(normalizePrice('Price on Application')).toEqual({ price: null, currency: null });
    expect(normalizePrice('Call for Price')).toEqual({ price: null, currency: null });
    expect(normalizePrice('Contact for pricing')).toEqual({ price: null, currency: null });
  });

  it('uses fallback currency when none detected', () => {
    expect(normalizePrice('85000', 'EUR')).toEqual({ price: '85000', currency: 'EUR' });
  });

  it('detected currency overrides fallback', () => {
    expect(normalizePrice('$85000', 'EUR')).toEqual({ price: '85000', currency: 'USD' });
  });
});
