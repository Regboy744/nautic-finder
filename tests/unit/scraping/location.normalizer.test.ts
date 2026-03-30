import { describe, it, expect } from 'vitest';
import { normalizeLocation } from '../../../src/scraping/normalizers/location.normalizer.js';

describe('normalizeLocation', () => {
  it('handles null/undefined/empty', () => {
    expect(normalizeLocation(null)).toEqual({ country: null, region: null, city: null });
    expect(normalizeLocation('')).toEqual({ country: null, region: null, city: null });
  });

  it('parses "City, Country"', () => {
    expect(normalizeLocation('Athens, Greece')).toEqual({
      country: 'Greece',
      region: null,
      city: 'Athens',
    });
  });

  it('parses "City, State, Country" (US format)', () => {
    expect(normalizeLocation('Fort Lauderdale, FL, USA')).toEqual({
      country: 'United States',
      region: 'Florida',
      city: 'Fort Lauderdale',
    });
  });

  it('parses "City, Region, Country" (European)', () => {
    expect(normalizeLocation('Antibes, Provence, France')).toEqual({
      country: 'France',
      region: 'Provence',
      city: 'Antibes',
    });
  });

  it('normalizes country aliases', () => {
    expect(normalizeLocation('Miami, USA')).toEqual({
      country: 'United States',
      region: null,
      city: 'Miami',
    });

    expect(normalizeLocation('London, UK')).toEqual({
      country: 'United Kingdom',
      region: null,
      city: 'London',
    });
  });

  it('handles single country name', () => {
    expect(normalizeLocation('Greece')).toEqual({
      country: 'Greece',
      region: null,
      city: null,
    });
  });

  it('handles Netherlands alias', () => {
    expect(normalizeLocation('Amsterdam, Holland')).toEqual({
      country: 'Netherlands',
      region: null,
      city: 'Amsterdam',
    });
  });

  it('capitalizes country names properly', () => {
    expect(normalizeLocation('Split, croatia')).toEqual({
      country: 'Croatia',
      region: null,
      city: 'Split',
    });
  });
});
