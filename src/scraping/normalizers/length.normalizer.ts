/**
 * Length normalizer — converts raw length/beam/draft strings to feet (decimal string).
 *
 * Handles formats like:
 * - "38ft" / "38 ft" / "38'" / "38 feet"
 * - "11.6m" / "11.6 m" / "11.6 metres" / "11,6m"
 * - "38' 6\"" (38 feet 6 inches)
 * - "38.5" (ambiguous — assumed feet if > 30, metres if <= 30)
 */

const METRES_TO_FEET = 3.28084;

/** Regex for feet + optional inches: 38'6" or 38 ft 6 in */
const FEET_INCHES_RE = /(\d+(?:[.,]\d+)?)\s*(?:ft|feet|')\s*(\d+(?:[.,]\d+)?)\s*(?:in|inches?|")?/i;

/** Regex for metres: 11.6m or 11,6 metres */
const METRES_RE = /(\d+(?:[.,]\d+)?)\s*(?:m|metres?|meters?)\b/i;

/** Regex for feet only: 38ft or 38 feet or 38' */
const FEET_RE = /(\d+(?:[.,]\d+)?)\s*(?:ft|feet|')\s*$/i;

/**
 * Normalizes a raw length string to feet as a decimal string.
 * Returns null if the value cannot be parsed.
 */
export function normalizeLength(raw: string | undefined | null): string | null {
  if (!raw || raw.trim().length === 0) return null;

  const trimmed = raw.trim();

  // Try feet + inches: "38' 6\"" → 38.5
  const feetInchesMatch = trimmed.match(FEET_INCHES_RE);
  if (feetInchesMatch) {
    const feet = parseDecimal(feetInchesMatch[1]);
    const inches = parseDecimal(feetInchesMatch[2]);
    if (feet !== null) {
      const total = feet + (inches ?? 0) / 12;
      return roundTo2(total);
    }
  }

  // Try metres: "11.6m" → convert to feet
  const metresMatch = trimmed.match(METRES_RE);
  if (metresMatch) {
    const metres = parseDecimal(metresMatch[1]);
    if (metres !== null) {
      return roundTo2(metres * METRES_TO_FEET);
    }
  }

  // Try feet only: "38ft" / "38'"
  const feetMatch = trimmed.match(FEET_RE);
  if (feetMatch) {
    const feet = parseDecimal(feetMatch[1]);
    if (feet !== null) return roundTo2(feet);
  }

  // Plain number — guess unit based on magnitude
  const plainNum = parseDecimal(trimmed.replace(/[^0-9.,\-]/g, ''));
  if (plainNum !== null) {
    if (plainNum <= 30) {
      // Likely metres (most boats under 30m)
      return roundTo2(plainNum * METRES_TO_FEET);
    }
    // Likely already in feet
    return roundTo2(plainNum);
  }

  return null;
}

/** Parses a decimal string that may use comma as decimal separator. */
function parseDecimal(raw: string): number | null {
  const cleaned = raw.replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Rounds to 2 decimal places and returns as string. */
function roundTo2(num: number): string {
  return (Math.round(num * 100) / 100).toString();
}
