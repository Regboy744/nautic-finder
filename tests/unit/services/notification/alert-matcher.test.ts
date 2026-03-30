import { describe, it, expect } from 'vitest';
import {
  matchListingToAlert,
  findMatchingAlerts,
} from '../../../../src/services/notification/alert-matcher.js';

function listing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    title: '2018 Bavaria Cruiser 38',
    make: 'Bavaria',
    modelName: 'Cruiser 38',
    boatType: 'sailboat',
    year: 2018,
    priceNormalizedEur: '85000',
    price: '85000',
    currency: 'EUR',
    country: 'Greece',
    lengthFt: '38',
    description: 'Well maintained bluewater cruiser',
    ...overrides,
  };
}

function alert(overrides: Record<string, unknown> = {}) {
  return {
    id: 'alert-1',
    userId: 'user-1',
    name: 'Sailboats in Greece',
    filters: { boatType: 'sailboat', country: 'greece', priceMax: 100000 },
    keywords: null,
    isActive: true,
    ...overrides,
  };
}

describe('alert matcher', () => {
  it('matches listing when filters align', () => {
    const result = matchListingToAlert(listing() as never, alert() as never);
    expect(result).toBe(true);
  });

  it('does not match when boat type differs', () => {
    const result = matchListingToAlert(
      listing({ boatType: 'motorboat' }) as never,
      alert() as never,
    );
    expect(result).toBe(false);
  });

  it('does not match when over max price', () => {
    const result = matchListingToAlert(
      listing({ priceNormalizedEur: '150000' }) as never,
      alert() as never,
    );
    expect(result).toBe(false);
  });

  it('matches keyword alerts when keyword appears in text', () => {
    const keywordAlert = alert({ filters: {}, keywords: 'bluewater' });
    const result = matchListingToAlert(listing() as never, keywordAlert as never);
    expect(result).toBe(true);
  });

  it('finds matching alerts and returns metadata', () => {
    const matches = findMatchingAlerts(
      listing() as never,
      [
        alert({ id: 'a1' }),
        alert({ id: 'a2', filters: { boatType: 'motorboat' } }),
        alert({ id: 'a3', isActive: false }),
      ] as never,
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].alertId).toBe('a1');
    expect(matches[0].userId).toBe('user-1');
  });
});
