/**
 * Application-wide constants.
 * Eliminates magic strings/numbers — import from here instead.
 */

// ---------------------------------------------------------------------------
// Boat taxonomy
// ---------------------------------------------------------------------------

/** Primary boat type categories. */
export const BOAT_TYPES = [
  'sailboat',
  'motorboat',
  'catamaran',
  'trawler',
  'center-console',
  'pontoon',
  'jet-ski',
  'dinghy',
  'houseboat',
  'other',
] as const;

export type BoatType = (typeof BOAT_TYPES)[number];

/** Sailboat subtypes. */
export const SAILBOAT_SUBTYPES = [
  'cruiser',
  'racer',
  'cruiser-racer',
  'daysailer',
  'cutter',
  'ketch',
  'sloop',
  'yawl',
  'schooner',
  'catboat',
] as const;

/** Motorboat subtypes. */
export const MOTORBOAT_SUBTYPES = [
  'cabin-cruiser',
  'express-cruiser',
  'sport-fish',
  'flybridge',
  'walkaround',
  'bowrider',
  'cuddy-cabin',
  'deck-boat',
  'ski-wake',
  'runabout',
] as const;

// ---------------------------------------------------------------------------
// Materials & construction
// ---------------------------------------------------------------------------

/** Hull material options. */
export const HULL_MATERIALS = [
  'fiberglass',
  'aluminum',
  'steel',
  'wood',
  'carbon-fiber',
  'ferro-cement',
  'composite',
  'hypalon',
  'pvc',
  'other',
] as const;

export type HullMaterial = (typeof HULL_MATERIALS)[number];

/** Keel types (sailboats). */
export const KEEL_TYPES = [
  'fin',
  'full',
  'modified-full',
  'wing',
  'bulb',
  'centerboard',
  'swing',
  'lifting',
  'bilge',
  'shoal',
] as const;

/** Rig types (sailboats). */
export const RIG_TYPES = [
  'sloop',
  'cutter',
  'ketch',
  'yawl',
  'schooner',
  'cat',
  'fractional',
  'masthead',
] as const;

// ---------------------------------------------------------------------------
// Propulsion
// ---------------------------------------------------------------------------

/** Fuel type options. */
export const FUEL_TYPES = ['diesel', 'gasoline', 'electric', 'hybrid', 'none'] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

/** Drive type options. */
export const DRIVE_TYPES = [
  'inboard',
  'outboard',
  'sterndrive',
  'jet',
  'sail',
  'pod',
  'electric',
] as const;

export type DriveType = (typeof DRIVE_TYPES)[number];

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

/** Supported currencies for price normalization. */
export const CURRENCIES = [
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'AUD',
  'NZD',
  'CAD',
] as const;

export type Currency = (typeof CURRENCIES)[number];

/** The two normalized price currencies we always store. */
export const NORMALIZED_CURRENCIES = ['EUR', 'USD'] as const;

/** Default currency for display if none specified. */
export const DEFAULT_CURRENCY: Currency = 'EUR';

// ---------------------------------------------------------------------------
// Condition & assessment
// ---------------------------------------------------------------------------

/** Price assessment labels assigned by AI. */
export const PRICE_ASSESSMENTS = ['fair', 'overpriced', 'bargain'] as const;

export type PriceAssessment = (typeof PRICE_ASSESSMENTS)[number];

/** Experience levels for user profiles. */
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

/** Search alert frequency options. */
export const ALERT_FREQUENCIES = ['instant', 'daily', 'weekly'] as const;

export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

// ---------------------------------------------------------------------------
// API defaults
// ---------------------------------------------------------------------------

/** Default page size for paginated endpoints. */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size allowed. */
export const MAX_PAGE_SIZE = 100;

/** Maximum results returned by vector search. */
export const MAX_VECTOR_RESULTS = 200;

/** Vector embedding dimensions (OpenAI text-embedding-3-small). */
export const EMBEDDING_DIMENSIONS = 1536;

// ---------------------------------------------------------------------------
// Scraping
// ---------------------------------------------------------------------------

/** Broker scraping tiers (determines priority and frequency). */
export const BROKER_TIERS = ['tier1', 'tier2', 'tier3'] as const;

export type BrokerTier = (typeof BROKER_TIERS)[number];

/** Scraper implementation types. */
export const SCRAPER_TYPES = ['cheerio', 'playwright'] as const;

export type ScraperType = (typeof SCRAPER_TYPES)[number];

// ---------------------------------------------------------------------------
// Redis key prefixes (appended after the global nf: prefix)
// ---------------------------------------------------------------------------

/** Redis key namespace prefixes for different concerns. */
export const REDIS_KEYS = {
  SEARCH_CACHE: 'search:',
  EXCHANGE_RATE: 'fx:',
  RATE_LIMIT: 'rl:',
  SESSION: 'session:',
  BROKER_HEALTH: 'broker-health:',
} as const;

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

/** Standard HTTP status codes used in the application. */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
