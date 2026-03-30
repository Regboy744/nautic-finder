/**
 * Core types for the scraping engine.
 */

/** Scraper implementation type. */
export type ScraperType = 'cheerio' | 'playwright';

/** Rate limiting config for a scraper. */
export interface RateLimitConfig {
  /** Max requests per second to the target site. */
  requestsPerSecond: number;
  /** Delay in ms between page requests. */
  delayMs: number;
  /** Max concurrent pages open at once. */
  maxConcurrency?: number;
}

/** CSS selectors for extracting data from a broker's listing pages. */
export interface BrokerSelectors {
  // -- Search/index page --
  /** URL template for the search/listing index page. Use {page} for pagination. */
  searchUrl: string;
  /** Selector for each listing card on the search page. */
  listingCard: string;
  /** Selector for the link to the detail page within a card. */
  detailUrl: string;

  // -- Detail page --
  title?: string;
  price?: string;
  currency?: string;
  year?: string;
  make?: string;
  model?: string;
  boatType?: string;
  location?: string;
  description?: string;
  images?: string;
  lengthFt?: string;
  beamFt?: string;
  draftFt?: string;
  hullMaterial?: string;
  engineMake?: string;
  engineModel?: string;
  engineHp?: string;
  engineHours?: string;
  fuelType?: string;
  cabins?: string;
  berths?: string;
  heads?: string;
  brokerName?: string;
  brokerPhone?: string;
  brokerEmail?: string;

  // -- Pagination --
  pagination?: {
    /** Selector for the "next page" button/link. */
    nextButton?: string;
    /** URL pattern with {page} placeholder for page-number based pagination. */
    pageUrlTemplate?: string;
    /** Max pages to scrape. Safety limit. */
    maxPages?: number;
  };
}

/**
 * Broker scraper configuration.
 * One config per broker website. Defines how to scrape it.
 */
export interface BrokerConfig {
  /** Human-readable name. */
  name: string;
  /** Base website URL. */
  website: string;
  /** Which scraper engine to use. */
  scraperType: ScraperType;
  /** Cron schedule expression (e.g., '0 2 * * *' for daily at 2am). */
  schedule: string;
  /** Rate limiting to avoid being blocked. */
  rateLimit: RateLimitConfig;
  /** CSS selectors for data extraction. */
  selectors: BrokerSelectors;
  /** Optional proxy URL override for this specific broker. */
  proxyUrl?: string;
  /** Custom headers to include in requests. */
  headers?: Record<string, string>;
  /** Whether this broker is currently enabled for scraping. */
  enabled?: boolean;
}

/**
 * Raw data extracted from a single listing page before normalization.
 * All fields are strings — normalizers convert them to proper types.
 */
export interface RawListingData {
  sourceUrl: string;
  sourcePlatform: string;
  externalId?: string;
  title?: string;
  price?: string;
  currency?: string;
  year?: string;
  make?: string;
  model?: string;
  boatType?: string;
  location?: string;
  description?: string;
  imageUrls?: string[];
  lengthFt?: string;
  beamFt?: string;
  draftFt?: string;
  hullMaterial?: string;
  engineMake?: string;
  engineModel?: string;
  engineHp?: string;
  engineHours?: string;
  fuelType?: string;
  cabins?: string;
  berths?: string;
  heads?: string;
  brokerName?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  /** Any additional fields the scraper extracts. */
  extra?: Record<string, string>;
}

/** Result of a scraper run for a single broker. */
export interface ScrapeRunResult {
  brokerName: string;
  startedAt: Date;
  completedAt: Date;
  totalPages: number;
  totalListings: number;
  newListings: number;
  updatedListings: number;
  errors: number;
  errorMessages: string[];
}
