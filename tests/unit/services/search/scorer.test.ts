import { describe, it, expect } from 'vitest';
import { scoreResults, SCORE_WEIGHTS } from '../../../../src/services/search/scorer.js';
import type { BoatListing } from '../../../../src/services/catalog/repositories/listings.repository.js';

/** Creates a minimal mock listing for scoring. */
function mockListing(overrides: Record<string, unknown> = {}): BoatListing {
  return {
    id: 'listing-1',
    title: 'Test Boat',
    make: 'Bavaria',
    modelName: 'Cruiser 38',
    year: 2018,
    boatType: 'sailboat',
    price: '85000',
    country: 'Greece',
    description: 'A nice boat',
    lengthFt: '38',
    hullMaterial: 'fiberglass',
    imageCount: 10,
    conditionScore: 8,
    lastSeenAt: new Date(),
    createdAt: new Date(),
    modelId: null,
    subtype: null,
    currency: null,
    priceNormalizedEur: null,
    priceNormalizedUsd: null,
    region: null,
    city: null,
    marinaName: null,
    latitude: null,
    longitude: null,
    features: [],
    imageUrls: [],
    beamFt: null,
    draftFt: null,
    displacementLbs: null,
    engineMake: null,
    engineModel: null,
    engineHp: null,
    engineHours: null,
    engineYear: null,
    fuelType: null,
    driveType: null,
    cabins: null,
    berths: null,
    heads: null,
    fuelCapacityL: null,
    waterCapacityL: null,
    conditionAnalysis: null,
    beginnerScore: null,
    useCaseTags: null,
    safetyNotes: null,
    summaryEn: null,
    priceAssessment: null,
    priceDeltaPct: null,
    brokerId: null,
    brokerName: null,
    brokerPhone: null,
    brokerEmail: null,
    brokerWebsite: null,
    isPrivateSale: false,
    sourceUrl: null,
    sourcePlatform: null,
    externalId: null,
    fingerprint: null,
    embedding: null,
    embeddingText: null,
    firstSeenAt: new Date(),
    lastCheckedAt: null,
    priceChangedAt: null,
    isActive: true,
    isFeatured: false,
    updatedAt: new Date(),
    ...overrides,
  } as BoatListing;
}

describe('scoreResults', () => {
  it('scores a listing with high similarity first', () => {
    const listings = [mockListing({ id: 'a' }), mockListing({ id: 'b' })];
    const similarityMap = new Map([
      ['a', 0.95],
      ['b', 0.5],
    ]);

    const results = scoreResults(listings, similarityMap);

    expect(results[0].listing.id).toBe('a');
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].breakdown.similarity).toBe(0.95);
  });

  it('weights sum to 1.0', () => {
    const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('gives higher photo score to listings with more images', () => {
    const listings = [
      mockListing({ id: 'a', imageCount: 15 }),
      mockListing({ id: 'b', imageCount: 0 }),
    ];

    const results = scoreResults(listings, new Map());
    const a = results.find((r) => r.listing.id === 'a')!;
    const b = results.find((r) => r.listing.id === 'b')!;
    expect(a.breakdown.photos).toBeGreaterThan(b.breakdown.photos);
  });

  it('gives higher freshness score to recently seen listings', () => {
    const listings = [
      mockListing({ id: 'a', lastSeenAt: new Date() }),
      mockListing({ id: 'b', lastSeenAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) }),
    ];

    const results = scoreResults(listings, new Map());
    const a = results.find((r) => r.listing.id === 'a')!;
    const b = results.find((r) => r.listing.id === 'b')!;
    expect(a.breakdown.freshness).toBeGreaterThan(b.breakdown.freshness);
  });

  it('gives higher condition score to better condition boats', () => {
    const listings = [
      mockListing({ id: 'a', conditionScore: 9 }),
      mockListing({ id: 'b', conditionScore: 3 }),
    ];

    const results = scoreResults(listings, new Map());
    const a = results.find((r) => r.listing.id === 'a')!;
    const b = results.find((r) => r.listing.id === 'b')!;
    expect(a.breakdown.condition).toBeGreaterThan(b.breakdown.condition);
  });

  it('gives higher completeness to listings with more fields filled', () => {
    const listings = [
      mockListing({ id: 'a' }),
      mockListing({
        id: 'b',
        title: null,
        make: null,
        modelName: null,
        description: null,
        lengthFt: null,
        hullMaterial: null,
      }),
    ];

    const results = scoreResults(listings, new Map());
    const a = results.find((r) => r.listing.id === 'a')!;
    const b = results.find((r) => r.listing.id === 'b')!;
    expect(a.breakdown.completeness).toBeGreaterThan(b.breakdown.completeness);
  });

  it('returns empty array for empty input', () => {
    const results = scoreResults([], new Map());
    expect(results).toEqual([]);
  });
});
