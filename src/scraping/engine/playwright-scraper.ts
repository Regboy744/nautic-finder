/**
 * Playwright-based scraper for JS-rendered / Cloudflare-protected sites.
 *
 * Connects to a remote Chromium instance running in Docker via WebSocket.
 * The browser in Docker has the proxy injected via --proxy-server flag.
 * This scraper authenticates with the proxy per-page and handles
 * Cloudflare JS challenges by waiting for the page to fully render.
 */

import * as cheerio from 'cheerio';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { Logger } from 'pino';
import type { BrokerConfig, RawListingData } from '../types.js';
import type { BrowserProfile } from '../stealth/headers.js';
import { getRandomProfile } from '../stealth/headers.js';
import { ScraperBase } from './scraper-base.js';

/** Anti-bot detection patterns in page content. */
const CHALLENGE_PATTERNS =
  /captcha|challenge-platform|just.a" moment|verify you are human|access.denied|cf-mitigated/i;

export interface PlaywrightScraperOptions {
  /** WebSocket endpoint to connect to the Docker browser. */
  wsEndpoint: string;
  /** Full proxy URL with auth for context-level proxy (e.g. https://user:pass@host:port). */
  proxyUrl?: string;
}

export class PlaywrightScraper extends ScraperBase {
  private readonly wsEndpoint: string;
  private readonly proxyUrl?: string;
  private readonly browserProfile: BrowserProfile;
  private browser?: Browser;
  private context?: BrowserContext;
  private lastPageUrl?: string;

  constructor(config: BrokerConfig, log: Logger, options: PlaywrightScraperOptions) {
    super(config, log);
    this.wsEndpoint = options.wsEndpoint;
    this.proxyUrl = options.proxyUrl;
    this.browserProfile = getRandomProfile();
    this.log.debug(
      { profileId: this.browserProfile.id, wsEndpoint: this.wsEndpoint },
      'PlaywrightScraper initialized',
    );
  }

  /**
   * Connect to the remote browser and create a stealth context.
   */
  private async ensureContext(): Promise<BrowserContext> {
    if (this.context) return this.context;

    this.log.info({ wsEndpoint: this.wsEndpoint }, 'Connecting to remote browser');
    this.browser = await chromium.connect(this.wsEndpoint);

    const ua = this.browserProfile.headers['User-Agent'];

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      userAgent: ua,
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      bypassCSP: true,
    };

    // Set proxy at the context level (not browser level) so auth works correctly
    if (this.proxyUrl) {
      const parsed = new URL(this.proxyUrl);
      contextOptions.proxy = {
        server: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
        username: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
      };
      this.log.info(
        { proxyServer: `${parsed.hostname}:${parsed.port}` },
        'Context proxy configured',
      );
    }

    this.context = await this.browser.newContext(contextOptions);

    // Block heavy resources
    await this.context.route('**/*.{png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf,eot}', (route) =>
      route.abort(),
    );

    // Anti-detection: override navigator.webdriver
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    return this.context;
  }

  /**
   * Create a new page with proxy authentication and stealth headers.
   */
  private async createPage(): Promise<Page> {
    const ctx = await this.ensureContext();
    const page = await ctx.newPage();

    // Set extra headers matching our browser profile
    const extraHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.browserProfile.headers)) {
      // Skip headers that Chromium sets automatically
      if (['User-Agent', 'Accept-Encoding', 'Connection'].includes(key)) continue;
      extraHeaders[key] = value;
    }
    await page.setExtraHTTPHeaders(extraHeaders);

    return page;
  }

  /**
   * Navigate to a URL, wait for Cloudflare challenge to resolve,
   * and return the rendered HTML.
   */
  protected async fetchPage(url: string): Promise<string> {
    const page = await this.createPage();

    try {
      // Set referrer
      const referer =
        this.lastPageUrl ??
        `https://www.google.com/search?q=${encodeURIComponent(new URL(url).hostname)}`;

      this.log.debug({ url, referer }, 'Navigating');

      // Navigate — Cloudflare may serve a JS challenge (403) first.
      // The browser executes the challenge JS, gets cf_clearance cookie,
      // then the real page loads. We wait for real content to appear.
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
        referer,
      });

      // Wait for real content to appear.
      // Strategy: try to find a known selector that only exists on the real page.
      // If not found, assume Cloudflare challenge and wait for it to resolve.
      const contentSelector = this.config.selectors.listingCard || 'body';
      const maxWaitMs = 45_000;
      const startTime = Date.now();
      let foundContent = false;

      while (Date.now() - startTime < maxWaitMs) {
        // Check if real content is present
        const elementCount = await page.locator(contentSelector).count();
        if (elementCount > 0) {
          foundContent = true;
          break;
        }

        // Also accept detail page content (title selector)
        if (this.config.selectors.title) {
          const titleCount = await page.locator(this.config.selectors.title).count();
          if (titleCount > 0) {
            foundContent = true;
            break;
          }
        }

        const elapsed = Math.round((Date.now() - startTime) / 1000);
        this.log.info(
          { url, elapsed: `${elapsed}s`, maxWait: `${maxWaitMs / 1000}s` },
          'Waiting for page content (possible Cloudflare challenge)...',
        );

        // Wait for navigation (challenge redirect) or a short timeout
        try {
          await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8_000 });
        } catch {
          // No navigation — wait a bit for in-place JS rendering
          await page.waitForTimeout(2_000 + Math.random() * 2_000);
        }

        try {
          await page.waitForLoadState('networkidle', { timeout: 5_000 });
        } catch {
          // Timeout OK
        }
      }

      const html = await page.content();

      if (!foundContent && this.isChallengePage(html)) {
        throw new Error(
          `Cloudflare challenge did not resolve within ${maxWaitMs / 1000}s on ${url}`,
        );
      }

      // Track referrer chain
      this.lastPageUrl = url;

      return html;
    } finally {
      await page.close();
    }
  }

  /**
   * Collects listing URLs from paginated search pages.
   * Reuses the same logic as CheerioScraper but with Playwright's fetchPage.
   */
  protected async collectListingUrls(): Promise<string[]> {
    const urls: string[] = [];
    const { selectors } = this.config;
    const maxPages = selectors.pagination?.maxPages ?? 50;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const searchUrl = selectors.pagination?.pageUrlTemplate
        ? selectors.pagination.pageUrlTemplate.replace('{page}', String(pageNum))
        : `${selectors.searchUrl}?page=${pageNum}`;

      let html: string;
      try {
        html = await this.fetchWithRetry(searchUrl);
      } catch (err) {
        this.log.warn({ page: pageNum, err }, 'Failed to fetch search page, stopping pagination');
        break;
      }

      const $ = cheerio.load(html);
      const cards = $(selectors.listingCard);

      if (cards.length === 0) {
        this.log.info({ page: pageNum }, 'No more listing cards found, stopping pagination');
        break;
      }

      cards.each((_i, el) => {
        const href = $(el).find(selectors.detailUrl).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http')
            ? href
            : new URL(href, this.config.website).toString();
          urls.push(fullUrl);
        }
      });

      this.log.debug(
        { page: pageNum, found: cards.length, total: urls.length },
        'Search page scraped',
      );

      if (selectors.pagination?.nextButton) {
        const hasNext = $(selectors.pagination.nextButton).length > 0;
        if (!hasNext) break;
      }
    }

    return [...new Set(urls)];
  }

  /**
   * Scrapes a single listing detail page.
   */
  protected async scrapeListing(url: string): Promise<RawListingData | null> {
    const html = await this.fetchWithRetry(url);
    const $ = cheerio.load(html);
    const { selectors } = this.config;

    const text = (selector: string | undefined): string | undefined => {
      if (!selector) return undefined;
      const val = $(selector).first().text().trim();
      return val || undefined;
    };

    const images = (selector: string | undefined): string[] => {
      if (!selector) return [];
      const imgs: string[] = [];
      $(selector).each((_i, el) => {
        const src = $(el).attr('src') ?? $(el).attr('data-src');
        if (src)
          imgs.push(src.startsWith('http') ? src : new URL(src, this.config.website).toString());
      });
      return imgs;
    };

    const raw: RawListingData = {
      sourceUrl: url,
      sourcePlatform: this.config.name.toLowerCase().replace(/\s+/g, '-'),
      externalId: extractExternalId(url),
      title: text(selectors.title),
      price: text(selectors.price),
      currency: text(selectors.currency),
      year: text(selectors.year),
      make: text(selectors.make),
      model: text(selectors.model),
      boatType: text(selectors.boatType),
      location: text(selectors.location),
      description: text(selectors.description),
      imageUrls: images(selectors.images),
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
      brokerName: text(selectors.brokerName),
      brokerPhone: text(selectors.brokerPhone),
      brokerEmail: text(selectors.brokerEmail),
    };

    return raw;
  }

  /**
   * Disconnect from the remote browser.
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = undefined;
    }
    if (this.browser) {
      this.browser.close().catch(() => {});
      this.browser = undefined;
    }
  }

  private isChallengePage(html: string): boolean {
    return CHALLENGE_PATTERNS.test(html);
  }
}

function extractExternalId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const idParam = parsed.searchParams.get('id');
    if (idParam) return idParam;

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
