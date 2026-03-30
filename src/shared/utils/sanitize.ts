/**
 * Input sanitization utilities.
 * Prevents XSS, SQL-ish patterns, and normalizes user-supplied strings.
 */

/** Regex for HTML tags. */
const HTML_TAG_RE = /<[^>]*>/g;

/** Regex for common SQL injection patterns. */
const SQL_INJECTION_RE =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b)/gi;

/**
 * Strips HTML tags from a string.
 * Use on any user-provided text that will be stored or displayed.
 */
export function stripHtml(input: string): string {
  return input.replace(HTML_TAG_RE, '');
}

/**
 * Trims whitespace and collapses multiple spaces into one.
 */
export function normalizeWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Full sanitization pipeline for user-supplied text:
 * 1. Strip HTML tags
 * 2. Normalize whitespace
 * 3. Trim to max length
 */
export function sanitizeText(input: string, maxLength = 5_000): string {
  let cleaned = stripHtml(input);
  cleaned = normalizeWhitespace(cleaned);
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitizes a search query string.
 * Removes SQL-ish keywords and normalizes for safe use in queries.
 */
export function sanitizeSearchQuery(input: string, maxLength = 500): string {
  let cleaned = stripHtml(input);
  cleaned = cleaned.replace(SQL_INJECTION_RE, '');
  cleaned = normalizeWhitespace(cleaned);
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitizes an email address (lowercase, trim).
 * Does NOT validate — use Zod for validation.
 */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Sanitizes a URL by trimming whitespace.
 * Does NOT validate — use Zod for validation.
 */
export function sanitizeUrl(input: string): string {
  return input.trim();
}

/**
 * Escapes special characters for use in SQL LIKE patterns.
 * Prevents user input from being interpreted as wildcards.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, (char) => `\\${char}`);
}
