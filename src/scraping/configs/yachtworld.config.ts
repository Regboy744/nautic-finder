import type { BrokerConfig } from '../types.js';

/**
 * YachtWorld scraper configuration.
 *
 * YachtWorld is the largest global yacht marketplace (~80,000 listings).
 * Part of the Boats Group network. Broker-only listings (no private sellers).
 *
 * Note: YachtWorld uses client-side rendering for some content,
 * so Playwright may be needed. Start with Cheerio and upgrade if selectors fail.
 *
 * IMPORTANT: Selectors below are EXAMPLES and must be updated by inspecting
 * the live site. YachtWorld frequently changes their HTML structure.
 */
export const yachtworldConfig: BrokerConfig = {
  name: 'YachtWorld',
  website: 'https://www.yachtworld.com',
  scraperType: 'playwright', // JS-rendered site
  schedule: '0 2 * * *', // Daily at 2am UTC
  rateLimit: {
    requestsPerSecond: 0.5, // 1 request every 2 seconds
    delayMs: 2_000,
    maxConcurrency: 1,
  },
  selectors: {
    // Search page
    searchUrl: 'https://www.yachtworld.com/boats-for-sale',
    listingCard: '[data-testid="boat-card"]',
    detailUrl: 'a[href*="/yacht/"]',

    // Detail page selectors (EXAMPLES — update after inspecting live site)
    title: 'h1[data-testid="listing-title"]',
    price: '[data-testid="listing-price"]',
    year: '[data-testid="boat-year"]',
    make: '[data-testid="boat-make"]',
    model: '[data-testid="boat-model"]',
    boatType: '[data-testid="boat-type"]',
    location: '[data-testid="listing-location"]',
    description: '[data-testid="listing-description"]',
    images: '[data-testid="gallery"] img',
    lengthFt: '[data-testid="spec-length"]',
    beamFt: '[data-testid="spec-beam"]',
    hullMaterial: '[data-testid="spec-hull-material"]',
    engineMake: '[data-testid="spec-engine-make"]',
    engineHp: '[data-testid="spec-engine-hp"]',
    engineHours: '[data-testid="spec-engine-hours"]',
    fuelType: '[data-testid="spec-fuel-type"]',
    cabins: '[data-testid="spec-cabins"]',
    brokerName: '[data-testid="broker-name"]',
    brokerPhone: '[data-testid="broker-phone"]',

    // Pagination
    pagination: {
      nextButton: '[data-testid="pagination-next"]',
      pageUrlTemplate: 'https://www.yachtworld.com/boats-for-sale?page={page}',
      maxPages: 100,
    },
  },
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  enabled: true,
};
