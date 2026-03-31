import type { BrokerConfig } from '../../types.js';

/**
 * YachtWorld config validated against real captured HTML fixtures.
 * Selector extraction remains the default path, with JSON-LD fallback in CheerioScraper.
 */
export const yachtworldConfig: BrokerConfig = {
  name: 'YachtWorld',
  website: 'https://www.yachtworld.com',
  scraperType: 'playwright',
  schedule: '0 2 * * *',
  rateLimit: {
    requestsPerSecond: 0.5,
    delayMs: 2_000,
    maxConcurrency: 1,
  },
  selectors: {
    // List/search page
    searchUrl: 'https://www.yachtworld.com/boats-for-sale',
    listingCard: '[data-testid="search-results-grid-new"] .grid-item',
    detailUrl: 'a.grid-listing-link[href*="/yacht/"]',

    // Detail page
    title: '#bdp-boat-summary h1',
    price: '#bdp-boat-summary .style-module_priceSection__wa5Pn > span > p',
    year: '.style-module_boatDetails__2wKB2 img[alt="year"] + div p',
    model: '.style-module_boatDetails__2wKB2 img[alt="boatModel"] + div p',
    boatType: '.style-module_boatDetails__2wKB2 img[alt="boatClass"] + div p',
    location: '#bdp-boat-summary header + div p',
    description: 'details[open] .render-html[data-e2e="render-html"]',
    images: '[data-e2e="media-carousel"] img[src*="images.boatsgroup.com"]',
    lengthFt: '.style-module_boatDetails__2wKB2 img[alt="length"] + div p',
    beamFt: 'span:contains("Beam") + span.cell-content-value',
    draftFt: 'span:contains("Max Draft") + span.cell-content-value',
    hullMaterial: 'span:contains("Hull Material") + span.cell-content-value',
    engineMake: 'span:contains("Engine Make") + span.cell-content-value',
    engineModel: 'span:contains("Engine Model") + span.cell-content-value',
    engineHp: 'span:contains("Total Power") + span.cell-content-value',
    engineHours: 'span:contains("Engine Hours") + span.cell-content-value',
    fuelType: 'span:contains("Fuel Type") + span.cell-content-value',
    cabins: 'span:contains("Guest Cabins") + span.cell-content-value',
    brokerName: 'p.style-module_sellerName__0tbQ5',
    brokerPhone: '[data-e2e="phoneDisplayer"] a[href^="tel:"]',

    pagination: {
      nextButton: '.pagination a.next',
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
