/**
 * Price normalizer — extracts numeric price and currency from raw strings.
 *
 * Handles formats like:
 * - "€85,000" / "$92,500" / "£75,000"
 * - "85.000 EUR" / "92500 USD"
 * - "85 000 €" / "CHF 120'000"
 * - "$92K" / "€1.2M"
 * - "POA" / "Price on Application" → null
 */

/** Currency symbol-to-code mapping. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  '€': 'EUR',
  $: 'USD',
  '£': 'GBP',
  kr: 'SEK', // Also NOK/DKK — ambiguous, defaults to SEK
  CHF: 'CHF',
  A$: 'AUD',
  NZ$: 'NZD',
  C$: 'CAD',
};

/** Multiplier suffixes. */
const MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  K: 1_000,
  m: 1_000_000,
  M: 1_000_000,
};

/** Patterns indicating price is not available. */
const NO_PRICE_PATTERNS =
  /\b(poa|price\s+on\s+(application|request)|call\s+for\s+price|contact|enquire|not\s+listed)\b/i;

/** Result of price normalization. */
export interface NormalizedPrice {
  price: string | null;
  currency: string | null;
}

/**
 * Normalizes a raw price string to a numeric value and currency code.
 * Returns null values if price is not available or unparseable.
 */
export function normalizePrice(
  raw: string | undefined | null,
  fallbackCurrency?: string,
): NormalizedPrice {
  if (!raw || raw.trim().length === 0) {
    return { price: null, currency: null };
  }

  const trimmed = raw.trim();

  // Check for "price on application" type strings
  if (NO_PRICE_PATTERNS.test(trimmed)) {
    return { price: null, currency: null };
  }

  // Detect currency — symbols and codes override fallback
  let currency: string | null = null;

  // Check for currency codes (EUR, USD, GBP, etc.)
  const codeMatch = trimmed.match(/\b(EUR|USD|GBP|CHF|SEK|NOK|DKK|AUD|NZD|CAD)\b/i);
  if (codeMatch) {
    currency = codeMatch[1].toUpperCase();
  }

  // Check for currency symbols (overrides code if both present)
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (trimmed.includes(symbol)) {
      currency = code;
      break;
    }
  }

  // Fall back to provided currency if nothing detected
  currency ??= fallbackCurrency ?? null;

  // Extract numeric value
  // Remove currency symbols, codes, and whitespace to isolate the number
  let numStr = trimmed
    .replace(/[€$£]/g, '')
    .replace(/\b(EUR|USD|GBP|CHF|SEK|NOK|DKK|AUD|NZD|CAD|kr|A\$|NZ\$|C\$)\b/gi, '')
    .trim();

  // Check for multiplier suffix (e.g., "92K", "1.2M")
  const multiplierMatch = numStr.match(/([0-9.,\s']+)\s*([kKmM])\s*$/);
  if (multiplierMatch) {
    numStr = multiplierMatch[1];
    const multiplier = MULTIPLIERS[multiplierMatch[2]] ?? 1;

    // Parse the base number
    const baseNum = parseNumericString(numStr);
    if (baseNum === null) return { price: null, currency };

    const finalPrice = Math.round(baseNum * multiplier);
    return { price: String(finalPrice), currency };
  }

  // Parse standard numeric format
  const parsed = parseNumericString(numStr);
  if (parsed === null) return { price: null, currency };

  return { price: String(Math.round(parsed)), currency };
}

/**
 * Parses a numeric string that may use different thousands/decimal separators.
 * Handles: "85,000" / "85.000" / "85 000" / "85'000" / "85000.50"
 */
function parseNumericString(raw: string): number | null {
  // Remove all whitespace and apostrophes (Swiss format)
  let cleaned = raw.replace(/[\s']/g, '');

  // Remove any remaining non-numeric chars except . and ,
  cleaned = cleaned.replace(/[^0-9.,\-]/g, '');

  // Detect concatenated prices: e.g. "224,000258,676" (from HTML text capturing multiple
  // price elements). Pattern: a valid thousands-comma-number immediately followed by more
  // digits with no separator. Truncate to the first price only.
  const concatMatch = cleaned.match(/^(\d{1,3}(?:,\d{3})+)\d/);
  if (concatMatch) {
    cleaned = concatMatch[1];
  }

  if (cleaned.length === 0) return null;

  // Determine if comma or period is the decimal separator
  // Heuristic: if the last separator has exactly 2-3 digits after it, it's decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Comma is last: "85.000,50" (European) or "85,000" (could be thousands)
    const afterComma = cleaned.slice(lastComma + 1);
    if (afterComma.length <= 2) {
      // Comma is decimal separator (European): "85.000,50" → "85000.50"
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Comma is thousands separator: "85,000" → "85000"
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (lastDot > lastComma) {
    // Dot is last: "85,000.50" (US) or "85.000" (European thousands)
    const afterDot = cleaned.slice(lastDot + 1);
    if (afterDot.length <= 2) {
      // Dot is decimal separator (US): "85,000.50" → "85000.50"
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Dot is thousands separator (European): "85.000" → "85000"
      cleaned = cleaned.replace(/\./g, '');
    }
  } else {
    // Only one type of separator or none — remove commas (treat as thousands)
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
