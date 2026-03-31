/**
 * Resource filter for Playwright browser contexts.
 *
 * Blocks non-essential resources (ads, analytics, images, CSS, fonts, media)
 * to minimize proxy bandwidth usage. Only HTML documents, first-party scripts,
 * and XHR/fetch requests needed for JS-rendered content are allowed.
 *
 * Based on proxy traffic analysis:
 * - Images (boatsgroup CDN):     ~353 MB / run  → blocked by type + domain
 * - Ads (adbutler, boatsgroup):  ~145 MB / run  → blocked by domain
 * - Analytics/tracking:          ~117 MB / run  → blocked by domain
 * - CSS:                         ~30-50 MB est. → blocked by type
 * Expected savings: ~85-90% proxy bandwidth reduction per run.
 */

import type { BrowserContext, Route } from 'playwright';
import type { Logger } from 'pino';

// ── Resource types to block ───────────────────────────────────────────────────

/**
 * Playwright resource types that are never needed for data extraction.
 * - image: we only collect image URLs from HTML, not the actual images
 * - stylesheet: DOM is parsed programmatically, rendering is irrelevant
 * - font: no visual rendering needed
 * - media: no video/audio needed
 */
export const BLOCKED_RESOURCE_TYPES = new Set<string>(['image', 'stylesheet', 'font', 'media']);

// ── Third-party domain blocklist ──────────────────────────────────────────────

/**
 * Known non-essential third-party domains observed in YachtWorld scrape runs.
 *
 * Supports three matching formats:
 *   "example.com"   → exact hostname OR any subdomain (foo.example.com)
 *   "*.example.com" → any subdomain only (NOT bare example.com)
 *   "sub.example.com" → exact subdomain only
 *
 * Cloudflare challenge domains are intentionally NOT listed here — they are
 * required for the anti-bot challenge to resolve.
 */
export const BLOCKED_DOMAINS: string[] = [
  // ── Image CDNs (boatsgroup) ─────────────────────────────────────────────
  // We extract image URLs from the HTML; we don't need the actual images.
  'images.boatsgroup.com',
  'images.qa.boatsgroup.com',
  'imt.boatwizard.com',

  // ── Ad networks ─────────────────────────────────────────────────────────
  'servedbyadbutler.com',
  'servedby.boatsgroup.com',
  's0.2mdn.net',
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',

  // ── Analytics & tag management ───────────────────────────────────────────
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'static.cloudflareinsights.com',

  // ── A/B testing & experimentation ───────────────────────────────────────
  '*.kameleoon.eu',
  'na-data.kameleoon.eu',

  // ── Social / sharing ─────────────────────────────────────────────────────
  'platform-api.sharethis.com',
  'l.sharethis.com',
  'connect.facebook.net',
  'platform.twitter.com',

  // ── Consent management ───────────────────────────────────────────────────
  'consent.trustarc.com',

  // ── Video ────────────────────────────────────────────────────────────────
  'youtube.com',
  'youtu.be',
  'ytimg.com',
  'googlevideo.com',

  // ── Fonts ────────────────────────────────────────────────────────────────
  // Also blocked by resource type, but explicit domain catch for edge cases.
  'fonts.googleapis.com',
  'fonts.gstatic.com',

  // ── Misc tracking / deep-linking ─────────────────────────────────────────
  'cdn.branch.io',
  'app.link',

  // ── Competing listing sites (cross-site redirects / trackers) ────────────
  'boattrader.com',
  'boats.com',
  'sailboatlistings.com',
];

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface ResourceFilterStats {
  /** Requests allowed through the filter. */
  allowed: number;
  /** Requests blocked because of their resource type (image, css, font, media). */
  blockedByType: number;
  /** Requests blocked because of their domain (ads, analytics, trackers). */
  blockedByDomain: number;
}

function createStats(): ResourceFilterStats {
  return { allowed: 0, blockedByType: 0, blockedByDomain: 0 };
}

// ── Domain matching ───────────────────────────────────────────────────────────

/**
 * Returns true if `hostname` matches the given pattern.
 *
 * Pattern rules:
 *   "*.example.com"   → matches sub.example.com but NOT example.com
 *   "example.com"     → matches example.com AND sub.example.com
 *   "sub.example.com" → matches only sub.example.com exactly
 */
export function matchesDomain(hostname: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    // Wildcard: only subdomains
    const base = pattern.slice(2); // "example.com"
    return hostname.endsWith('.' + base);
  }
  // Exact or subdomain match
  return hostname === pattern || hostname.endsWith('.' + pattern);
}

/**
 * Returns true if `hostname` should be blocked according to the blocklist.
 */
export function isBlockedDomain(hostname: string): boolean {
  return BLOCKED_DOMAINS.some((pattern) => matchesDomain(hostname, pattern));
}

// ── Route handler setup ───────────────────────────────────────────────────────

/**
 * Registers a single catch-all route handler on the given Playwright context
 * that aborts non-essential requests to save proxy bandwidth.
 *
 * Returns a live `ResourceFilterStats` object — its counters are incremented
 * as requests are processed, so you can read it at any time during or after
 * the scrape run.
 *
 * @example
 * ```ts
 * const stats = setupResourceBlocking(context, log);
 * // ... scrape pages ...
 * logFilterStats(stats, log);
 * ```
 */
export async function setupResourceBlocking(
  context: BrowserContext,
  log: Logger,
): Promise<ResourceFilterStats> {
  const stats = createStats();

  await context.route('**/*', (route: Route) => {
    const request = route.request();
    const resourceType = request.resourceType();
    const url = request.url();

    // 1. Block by resource type first (cheap check, no URL parsing)
    if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
      stats.blockedByType++;
      log.trace({ url, resourceType }, 'Blocked by type');
      return route.abort();
    }

    // 2. Block by domain
    try {
      const { hostname } = new URL(url);
      if (isBlockedDomain(hostname)) {
        stats.blockedByDomain++;
        log.trace({ url, hostname }, 'Blocked by domain');
        return route.abort();
      }
    } catch {
      // Malformed URL — let it through rather than break the page
    }

    // 3. Allow everything else
    stats.allowed++;
    return route.continue();
  });

  return stats;
}

// ── Logging helper ────────────────────────────────────────────────────────────

/**
 * Logs a summary of the resource filter stats at `info` level.
 * Call this at the end of a scrape run or context lifecycle.
 */
export function logFilterStats(stats: ResourceFilterStats, log: Logger): void {
  const total = stats.allowed + stats.blockedByType + stats.blockedByDomain;
  const blocked = stats.blockedByType + stats.blockedByDomain;
  const pct = total > 0 ? Math.round((blocked / total) * 100) : 0;

  log.info(
    {
      allowed: stats.allowed,
      blockedByType: stats.blockedByType,
      blockedByDomain: stats.blockedByDomain,
      totalRequests: total,
      blockedPct: `${pct}%`,
    },
    'Resource filter summary',
  );
}
