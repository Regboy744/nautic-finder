/**
 * Location normalizer — splits raw location strings into country, region, city.
 *
 * Handles formats like:
 * - "Athens, Greece"
 * - "Fort Lauderdale, FL, USA"
 * - "Palma de Mallorca, Spain"
 * - "Split, Croatia"
 * - "Antibes, Provence-Alpes-Côte d'Azur, France"
 */

/** Result of location normalization. */
export interface NormalizedLocation {
  country: string | null;
  region: string | null;
  city: string | null;
}

/** Common country name aliases to canonical form. */
const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom',
  'great britain': 'United Kingdom',
  'the netherlands': 'Netherlands',
  holland: 'Netherlands',
  uae: 'United Arab Emirates',
  'new zealand': 'New Zealand',
  nz: 'New Zealand',
};

/** US state abbreviations → full name. */
const US_STATES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

/**
 * Normalizes a raw location string into structured components.
 */
export function normalizeLocation(raw: string | undefined | null): NormalizedLocation {
  if (!raw || raw.trim().length === 0) {
    return { country: null, region: null, city: null };
  }

  // Split by comma and trim each part
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) {
    return { country: null, region: null, city: null };
  }

  // Single part — assume it's a country or city
  if (parts.length === 1) {
    const normalized = normalizeCountryName(parts[0]);
    // If it looks like a known country alias, treat as country
    if (COUNTRY_ALIASES[parts[0].toLowerCase()]) {
      return { country: normalized, region: null, city: null };
    }
    return { country: normalized, region: null, city: null };
  }

  // Two parts — "City, Country" or "State, Country"
  if (parts.length === 2) {
    const country = normalizeCountryName(parts[1]);
    return { country, region: null, city: parts[0] };
  }

  // Three or more parts — "City, Region/State, Country"
  const country = normalizeCountryName(parts[parts.length - 1]);
  const regionOrState = parts[parts.length - 2];
  const city = parts[0];

  // Check if regionOrState is a US state abbreviation
  const stateAbbrev = regionOrState.toUpperCase().trim();
  const region = US_STATES[stateAbbrev] ?? regionOrState;

  return { country, region, city };
}

/** Normalizes a country name to canonical form. */
function normalizeCountryName(raw: string): string {
  const lower = raw.toLowerCase().trim();

  // Check aliases
  const alias = COUNTRY_ALIASES[lower];
  if (alias) return alias;

  // Check US state abbreviations (sometimes listed as "FL" alone)
  const upper = raw.toUpperCase().trim();
  if (US_STATES[upper]) {
    return 'United States';
  }

  // Capitalize first letter of each word
  return raw
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
