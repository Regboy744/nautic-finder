import * as cheerio from 'cheerio';
import type { HttpsProxyAgent } from 'https-proxy-agent';
import type { Logger } from 'pino';
import type { BrokerConfig, RawListingData } from '../types.js';
import {
  type BrowserProfile,
  buildStealthHeaders,
  CookieJar,
  getRandomProfile,
} from '../stealth/index.js';
import { ScraperBase } from './scraper-base.js';

/** Anti-bot detection patterns in response body. */
const BLOCKED_PATTERNS =
  /captcha|challenge-platform|just.a" moment|verify you are human|access.denied|blocked|cf-mitigated/i;

interface JsonLdProductData {
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
  make?: string;
  brokerName?: string;
  externalId?: string;
  imageUrls: string[];
}

/** Options for creating a CheerioScraper with proxy support. */
export interface CheerioScraperOptions {
  /** HttpsProxyAgent to tunnel requests through (from ProxyService). */
  proxyAgent?: HttpsProxyAgent<string>;
}

/**
 * Cheerio-based scraper for static HTML pages.
 * Integrates 7-layer anti-bot evasion:
 *   1. Proxy agent (Decodo)
 *   2. Realistic browser header profiles
 *   3. Request timing jitter (in ScraperBase)
 *   4. Referrer chain
 *   5. Cookie persistence per session
 *   6. Response-aware retry (403/429/captcha detection)
 *   7. TLS-level hints (Accept-Encoding, Connection)
 */
export class CheerioScraper extends ScraperBase {
  private readonly proxyAgent?: HttpsProxyAgent<string>;
  private readonly browserProfile: BrowserProfile;
  private readonly cookieJar: CookieJar;
  private lastPageUrl?: string;

  constructor(config: BrokerConfig, log: Logger, options?: CheerioScraperOptions) {
    super(config, log);
    this.proxyAgent = options?.proxyAgent;
    this.browserProfile = getRandomProfile();
    this.cookieJar = new CookieJar();
    this.log.debug({ profileId: this.browserProfile.id }, 'Selected browser profile for session');
  }

  /**
   * Fetches HTML content with full anti-bot evasion stack.
   */
  protected async fetchPage(url: string): Promise<string> {
    // Build referrer chain: google for first request, previous page for subsequent
    const referer =
      this.lastPageUrl ??
      `https://www.google.com/search?q=${encodeURIComponent(new URL(url).hostname)}`;

    const headers = buildStealthHeaders(this.browserProfile, {
      referer,
      cookie: this.cookieJar.getCookieHeader(url),
      brokerHeaders: this.config.headers,
    });

    const fetchOptions: RequestInit & { agent?: HttpsProxyAgent<string> } = {
      headers,
      signal: AbortSignal.timeout(30_000),
    };

    // Layer 1: Proxy agent injection
    if (this.proxyAgent) {
      fetchOptions.agent = this.proxyAgent;
    }

    const response = await fetch(url, fetchOptions);

    // Layer 5: Cookie persistence — capture Set-Cookie headers
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      this.cookieJar.addFromResponse(url, setCookies);
    }

    // Layer 6: Response-aware error handling
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10_000;
      throw new Error(`HTTP 429: Rate limited. Retry after ${waitMs}ms`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Layer 6: Detect soft blocks (200 but blocked content)
    if (html.length < 5000 && BLOCKED_PATTERNS.test(html)) {
      throw new Error(`Soft block detected on ${url} (captcha/challenge page)`);
    }

    // Layer 4: Track referrer chain
    this.lastPageUrl = url;

    return html;
  }

  /**
   * Collects listing URLs from paginated search pages.
   */
  protected async collectListingUrls(): Promise<string[]> {
    const urls: string[] = [];
    const { selectors } = this.config;
    const maxPages = selectors.pagination?.maxPages ?? 50;

    for (let page = 1; page <= maxPages; page++) {
      // Build search URL for this page
      const searchUrl = selectors.pagination?.pageUrlTemplate
        ? selectors.pagination.pageUrlTemplate.replace('{page}', String(page))
        : `${selectors.searchUrl}?page=${page}`;

      let html: string;
      try {
        html = await this.fetchWithRetry(searchUrl);
      } catch (err) {
        this.log.warn({ page, err }, 'Failed to fetch search page, stopping pagination');
        break;
      }

      const $ = cheerio.load(html);
      const cards = $(selectors.listingCard);

      if (cards.length === 0) {
        this.log.info({ page }, 'No more listing cards found, stopping pagination');
        break;
      }

      cards.each((_i, el) => {
        const href = $(el).find(selectors.detailUrl).attr('href');
        if (href) {
          // Resolve relative URLs
          const fullUrl = href.startsWith('http')
            ? href
            : new URL(href, this.config.website).toString();
          urls.push(fullUrl);
        }
      });

      this.log.debug({ page, found: cards.length, total: urls.length }, 'Search page scraped');

      // Check for next page
      if (selectors.pagination?.nextButton) {
        const hasNext = $(selectors.pagination.nextButton).length > 0;
        if (!hasNext) break;
      }
    }

    return [...new Set(urls)]; // Deduplicate
  }

  /**
   * Scrapes a single listing detail page.
   */
  protected async scrapeListing(url: string): Promise<RawListingData | null> {
    const html = await this.fetchWithRetry(url);
    const $ = cheerio.load(html);
    const { selectors } = this.config;
    const jsonLd = parseProductJsonLd($);

    /** Helper to extract text from a selector, returns undefined if not found. */
    const text = (selector: string | undefined): string | undefined => {
      if (!selector) return undefined;
      const val = $(selector).first().text().trim();
      return val || undefined;
    };

    /** Extracts all image URLs from a selector. */
    const images = (selector: string | undefined): string[] => {
      if (!selector) return [];
      const imgs: string[] = [];
      $(selector).each((_i, el) => {
        const src = $(el).attr('src') ?? $(el).attr('data-src');
        if (src) imgs.push(toAbsoluteUrl(src, this.config.website));
      });
      return imgs;
    };

    const title = text(selectors.title) ?? jsonLd.title;
    const inferredFromTitle = inferFromTitle(title);
    const imageUrls = Array.from(
      new Set([
        ...images(selectors.images),
        ...jsonLd.imageUrls.map((imageUrl) => toAbsoluteUrl(imageUrl, this.config.website)),
      ]),
    );

    const raw: RawListingData = {
      sourceUrl: url,
      sourcePlatform: this.config.name.toLowerCase().replace(/\s+/g, '-'),
      externalId: extractExternalId(url) ?? jsonLd.externalId,
      title,
      price: jsonLd.price ?? text(selectors.price),
      currency: jsonLd.currency ?? text(selectors.currency),
      year: text(selectors.year) ?? inferredFromTitle.year,
      make: text(selectors.make) ?? jsonLd.make ?? inferredFromTitle.make,
      model: text(selectors.model) ?? inferredFromTitle.model,
      boatType: text(selectors.boatType),
      location: text(selectors.location),
      description: text(selectors.description) ?? jsonLd.description,
      imageUrls,
      lengthFt: text(selectors.lengthFt),
      beamFt: text(selectors.beamFt),
      draftFt: text(selectors.draftFt),
      hullMaterial: text(selectors.hullMaterial),
      engineMake: text(selectors.engineMake),
      engineModel: text(selectors.engineModel),
      engineHp: text(selectors.engineHp),
      engineHours: text(selectors.engineHours),
      fuelType: text(selectors.fuelType),
      cabins: text(selectors.cabins),
      berths: text(selectors.berths),
      heads: text(selectors.heads),
      brokerName: text(selectors.brokerName) ?? jsonLd.brokerName,
      brokerPhone: text(selectors.brokerPhone),
      brokerEmail: text(selectors.brokerEmail),
    };

    return raw;
  }
}

function parseProductJsonLd($: cheerio.CheerioAPI): JsonLdProductData {
  const parsedBlocks: unknown[] = [];

  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          parsedBlocks.push(entry);
        }
      } else {
        parsedBlocks.push(parsed);
      }
    } catch {
      // Ignore malformed JSON-LD blocks from third-party widgets.
    }
  });

  const productNode = parsedBlocks.find((node) => hasJsonLdType(node, 'Product'));
  if (!isRecord(productNode)) {
    return { imageUrls: [] };
  }

  const offers = resolveOfferNode(productNode.offers);
  const brand = resolveNameNode(productNode.brand);
  const seller = resolveNameNode(offers?.seller);

  return {
    title: toStringValue(productNode.name),
    description: toStringValue(productNode.description),
    price: toStringValue(offers?.price),
    currency: toStringValue(offers?.priceCurrency),
    make: brand,
    brokerName: seller,
    externalId: toStringValue(productNode.productID),
    imageUrls: resolveImageUrls(productNode.image),
  };
}

function resolveOfferNode(offers: unknown): Record<string, unknown> | undefined {
  if (isRecord(offers)) {
    return offers;
  }

  if (Array.isArray(offers)) {
    return offers.find(isRecord);
  }

  return undefined;
}

function resolveImageUrls(imageField: unknown): string[] {
  if (typeof imageField === 'string' && imageField.trim()) {
    return [imageField.trim()];
  }

  if (Array.isArray(imageField)) {
    return imageField
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());
  }

  return [];
}

function resolveNameNode(node: unknown): string | undefined {
  if (typeof node === 'string') {
    return node.trim() || undefined;
  }

  if (isRecord(node)) {
    return toStringValue(node.name);
  }

  return undefined;
}

function hasJsonLdType(node: unknown, targetType: string): boolean {
  if (!isRecord(node)) return false;

  const typeField = node['@type'];
  if (typeof typeField === 'string') {
    return typeField === targetType;
  }

  if (Array.isArray(typeField)) {
    return typeField.includes(targetType);
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) return url;

  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function inferFromTitle(title: string | undefined): {
  year?: string;
  make?: string;
  model?: string;
} {
  if (!title) return {};

  const canonicalTitle = title.split('|')[0]?.trim();
  if (!canonicalTitle) return {};

  const match = canonicalTitle.match(/^(\d{4})\s+(.+)$/);
  if (!match) return {};

  const [, year, rest] = match;
  const tokens = rest.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { year };
  }

  return {
    year,
    make: tokens[0],
    model: tokens.slice(1).join(' ') || undefined,
  };
}

/**
 * Extracts an external ID from a listing URL.
 * Tries the last numeric segment of the path, or an 'id' query param.
 */
function extractExternalId(url: string): string | undefined {
  try {
    const parsed = new URL(url);

    // Try query param 'id'
    const idParam = parsed.searchParams.get('id');
    if (idParam) return idParam;

    // Try last path segment that contains numbers
    const segments = parsed.pathname.split('/').filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const numericSuffix = segments[i].match(/(\d{4,})$/);
      if (numericSuffix) return numericSuffix[1];
      if (/\d/.test(segments[i])) return segments[i];
    }

    return undefined;
  } catch {
    return undefined;
  }
}
