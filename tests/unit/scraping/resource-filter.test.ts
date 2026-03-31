import { describe, it, expect } from 'vitest';
import pino from 'pino';
import {
  matchesDomain,
  isBlockedDomain,
  BLOCKED_RESOURCE_TYPES,
  BLOCKED_DOMAINS,
  logFilterStats,
  type ResourceFilterStats,
} from '../../../src/scraping/engine/resource-filter.js';

const silentLog = pino({ level: 'silent' });

// ── matchesDomain ─────────────────────────────────────────────────────────────

describe('matchesDomain', () => {
  it('matches exact hostname', () => {
    expect(matchesDomain('example.com', 'example.com')).toBe(true);
  });

  it('matches subdomain of a plain pattern', () => {
    expect(matchesDomain('sub.example.com', 'example.com')).toBe(true);
    expect(matchesDomain('a.b.example.com', 'example.com')).toBe(true);
  });

  it('does not match unrelated domain with plain pattern', () => {
    expect(matchesDomain('notexample.com', 'example.com')).toBe(false);
    expect(matchesDomain('example.com.evil.io', 'example.com')).toBe(false);
  });

  it('wildcard pattern matches subdomain only', () => {
    expect(matchesDomain('sub.kameleoon.eu', '*.kameleoon.eu')).toBe(true);
    expect(matchesDomain('a.b.kameleoon.eu', '*.kameleoon.eu')).toBe(true);
  });

  it('wildcard pattern does NOT match bare domain', () => {
    expect(matchesDomain('kameleoon.eu', '*.kameleoon.eu')).toBe(false);
  });

  it('exact subdomain pattern matches only that subdomain', () => {
    expect(matchesDomain('na-data.kameleoon.eu', 'na-data.kameleoon.eu')).toBe(true);
    expect(matchesDomain('other.kameleoon.eu', 'na-data.kameleoon.eu')).toBe(false);
    expect(matchesDomain('kameleoon.eu', 'na-data.kameleoon.eu')).toBe(false);
  });
});

// ── isBlockedDomain ───────────────────────────────────────────────────────────

describe('isBlockedDomain', () => {
  // Domains that MUST be blocked
  it('blocks image CDN domains', () => {
    expect(isBlockedDomain('images.boatsgroup.com')).toBe(true);
    expect(isBlockedDomain('images.qa.boatsgroup.com')).toBe(true);
    expect(isBlockedDomain('imt.boatwizard.com')).toBe(true);
  });

  it('blocks ad network domains', () => {
    expect(isBlockedDomain('servedbyadbutler.com')).toBe(true);
    expect(isBlockedDomain('www.servedbyadbutler.com')).toBe(true);
    expect(isBlockedDomain('servedby.boatsgroup.com')).toBe(true);
    expect(isBlockedDomain('s0.2mdn.net')).toBe(true);
    expect(isBlockedDomain('doubleclick.net')).toBe(true);
    expect(isBlockedDomain('ad.doubleclick.net')).toBe(true);
  });

  it('blocks analytics and tag manager domains', () => {
    expect(isBlockedDomain('googletagmanager.com')).toBe(true);
    expect(isBlockedDomain('www.googletagmanager.com')).toBe(true);
    expect(isBlockedDomain('google-analytics.com')).toBe(true);
    expect(isBlockedDomain('static.cloudflareinsights.com')).toBe(true);
  });

  it('blocks A/B testing domains (kameleoon wildcard)', () => {
    expect(isBlockedDomain('6tukvyck0c.kameleoon.eu')).toBe(true);
    expect(isBlockedDomain('na-data.kameleoon.eu')).toBe(true);
  });

  it('blocks social/sharing domains', () => {
    expect(isBlockedDomain('platform-api.sharethis.com')).toBe(true);
    expect(isBlockedDomain('l.sharethis.com')).toBe(true);
    expect(isBlockedDomain('connect.facebook.net')).toBe(true);
  });

  it('blocks consent management domains', () => {
    expect(isBlockedDomain('consent.trustarc.com')).toBe(true);
  });

  it('blocks video domains', () => {
    expect(isBlockedDomain('youtube.com')).toBe(true);
    expect(isBlockedDomain('www.youtube.com')).toBe(true);
    expect(isBlockedDomain('youtu.be')).toBe(true);
  });

  it('blocks font domains', () => {
    expect(isBlockedDomain('fonts.googleapis.com')).toBe(true);
    expect(isBlockedDomain('fonts.gstatic.com')).toBe(true);
  });

  it('blocks misc tracking domains', () => {
    expect(isBlockedDomain('cdn.branch.io')).toBe(true);
  });

  // Domains that MUST NOT be blocked
  it('does NOT block yachtworld.com', () => {
    expect(isBlockedDomain('yachtworld.com')).toBe(false);
    expect(isBlockedDomain('www.yachtworld.com')).toBe(false);
  });

  it('does NOT block Cloudflare challenge domain', () => {
    expect(isBlockedDomain('challenges.cloudflare.com')).toBe(false);
  });

  it('does NOT block unrelated domains', () => {
    expect(isBlockedDomain('example.com')).toBe(false);
    expect(isBlockedDomain('api.somebroker.com')).toBe(false);
  });
});

// ── BLOCKED_RESOURCE_TYPES ────────────────────────────────────────────────────

describe('BLOCKED_RESOURCE_TYPES', () => {
  it('blocks image, font, media', () => {
    expect(BLOCKED_RESOURCE_TYPES.has('image')).toBe(true);
    // expect(BLOCKED_RESOURCE_TYPES.has('stylesheet')).toBe(true);
    expect(BLOCKED_RESOURCE_TYPES.has('font')).toBe(true);
    expect(BLOCKED_RESOURCE_TYPES.has('media')).toBe(true);
  });

  it('does NOT block document, script, xhr, fetch', () => {
    expect(BLOCKED_RESOURCE_TYPES.has('document')).toBe(false);
    expect(BLOCKED_RESOURCE_TYPES.has('script')).toBe(false);
    expect(BLOCKED_RESOURCE_TYPES.has('xhr')).toBe(false);
    expect(BLOCKED_RESOURCE_TYPES.has('fetch')).toBe(false);
  });
});

// ── BLOCKED_DOMAINS list completeness ────────────────────────────────────────

describe('BLOCKED_DOMAINS list', () => {
  it('contains all domains from the proxy traffic report', () => {
    const reportDomains = [
      'images.boatsgroup.com',
      'servedbyadbutler.com',
      'googletagmanager.com',
      '*.kameleoon.eu', // covers 6tukvyck0c.kameleoon.eu and na-data.kameleoon.eu
      'platform-api.sharethis.com',
      'images.qa.boatsgroup.com',
      'consent.trustarc.com',
      'youtube.com',
      'static.cloudflareinsights.com',
      'servedby.boatsgroup.com',
      'l.sharethis.com',
      'fonts.googleapis.com',
      'imt.boatwizard.com',
      'youtu.be',
      'fonts.gstatic.com',
      'cdn.branch.io',
    ];
    for (const domain of reportDomains) {
      expect(BLOCKED_DOMAINS).toContain(domain);
    }
  });
});

// ── logFilterStats ────────────────────────────────────────────────────────────

describe('logFilterStats', () => {
  it('logs without throwing', () => {
    const stats: ResourceFilterStats = {
      allowed: 42,
      blockedByType: 150,
      blockedByDomain: 200,
    };
    expect(() => logFilterStats(stats, silentLog)).not.toThrow();
  });

  it('handles zero total without dividing by zero', () => {
    const stats: ResourceFilterStats = { allowed: 0, blockedByType: 0, blockedByDomain: 0 };
    expect(() => logFilterStats(stats, silentLog)).not.toThrow();
  });
});
