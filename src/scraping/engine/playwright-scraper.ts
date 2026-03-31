/**
 * Playwright-based scraper for JS-rendered / Cloudflare-protected sites.
 *
 * Connects to a remote Chromium in Docker (no proxy at browser level).
 * Proxy is set per-context so each run gets its own IP.
 * Docker container must be restarted between runs for a fresh browser.
 */

import * as cheerio from 'cheerio';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { Logger } from 'pino';
import type { BrokerConfig, RawListingData } from '../types.js';
import { getRandomProfile, type BrowserProfile } from '../stealth/index.js';
import { ScraperBase } from './scraper-base.js';
import {
  setupResourceBlocking,
  logFilterStats,
  type ResourceFilterStats,
} from './resource-filter.js';

export interface PlaywrightScraperOptions {
  /** WebSocket endpoint for the Docker browser. */
  wsEndpoint: string;
  /** Full proxy URL (e.g. https://user:pass@host:port). */
  proxyUrl?: string;
}

export class PlaywrightScraper extends ScraperBase {
  private readonly wsEndpoint: string;
  private readonly proxyUrl?: string;
  private readonly browserProfile: BrowserProfile;
  private browser?: Browser;
  private context?: BrowserContext;
  private filterStats?: ResourceFilterStats;
  private lastPageUrl?: string;

  constructor(config: BrokerConfig, log: Logger, options: PlaywrightScraperOptions) {
    super(config, log);
    this.wsEndpoint = options.wsEndpoint;
    this.proxyUrl = options.proxyUrl;
    this.browserProfile = getRandomProfile();
  }

  // ── Context management (one context per scrape run) ──

  private async resetContext(): Promise<void> {
    if (this.filterStats) {
      logFilterStats(this.filterStats, this.log);
      this.filterStats = undefined;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = undefined;
    }
  }

  private async ensureContext(): Promise<BrowserContext> {
    if (this.context) return this.context;

    if (!this.browser) {
      this.log.info({ wsEndpoint: this.wsEndpoint }, 'Connecting to remote browser');
      this.browser = await chromium.connect(this.wsEndpoint);
    }

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      userAgent: this.browserProfile.headers['User-Agent'],
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      bypassCSP: true,
    };

    if (this.proxyUrl) {
      const parsed = new URL(this.proxyUrl);
      contextOptions.proxy = {
        server: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
        username: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
      };
      this.log.info({ proxyServer: `${parsed.hostname}:${parsed.port}` }, 'Proxy configured');
    }

    this.context = await this.browser.newContext(contextOptions);

    // Block non-essential resources (images, CSS, fonts, ads, analytics, trackers)
    // to minimize proxy bandwidth usage (~85-90% reduction expected).
    this.filterStats = await setupResourceBlocking(this.context, this.log);

    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    return this.context;
  }

  private async createPage(): Promise<Page> {
    const ctx = await this.ensureContext();
    const page = await ctx.newPage();

    const extraHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.browserProfile.headers)) {
      if (['User-Agent', 'Accept-Encoding', 'Connection'].includes(key)) continue;
      extraHeaders[key] = value;
    }
    await page.setExtraHTTPHeaders(extraHeaders);

    return page;
  }

  // ── Page fetching ──

  protected async fetchPage(url: string): Promise<string> {
    const page = await this.createPage();

    try {
      const referer =
        this.lastPageUrl ??
        `https://www.google.com/search?q=${encodeURIComponent(new URL(url).hostname)}`;

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
        referer,
      });

      // Wait for real content (up to 15s for Cloudflare challenge to resolve)
      const contentSelector = this.config.selectors.listingCard || 'body';
      const maxWaitMs = 15_000;
      const start = Date.now();
      let found = false;

      while (Date.now() - start < maxWaitMs) {
        if ((await page.locator(contentSelector).count()) > 0) {
          found = true;
          break;
        }
        if (this.config.selectors.title) {
          if ((await page.locator(this.config.selectors.title).count()) > 0) {
            found = true;
            break;
          }
        }
        try {
          await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3_000 });
        } catch {
          await page.waitForTimeout(1_500);
        }
      }

      const html = await page.content();

      // Halt any in-flight requests (late analytics, lazy images, etc.) now
      // that we have the HTML we need. Saves additional proxy bandwidth.
      // Using string form to avoid TypeScript "lib" issues (runs in browser).
      await page.evaluate('window.stop()').catch(() => {});

      if (!found && /captcha|challenge-platform|verify you are human|cf-mitigated/i.test(html)) {
        // Reset context so the next retry gets a fresh browser fingerprint
        await this.resetContext();
        throw new Error('Cloudflare challenge not resolved');
      }

      this.lastPageUrl = url;
      return html;
    } finally {
      await page.close();
    }
  }

  // ── URL collection ──

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
        this.log.info({ page: pageNum }, 'No more listing cards found, stopping');
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

      this.log.info({ page: pageNum, found: cards.length, total: urls.length }, 'Page scraped');

      if (selectors.pagination?.nextButton) {
        const hasNext = $(selectors.pagination.nextButton).length > 0;
        if (!hasNext) break;
      }
    }

    return [...new Set(urls)];
  }

  // ── Detail extraction ──

  protected async scrapeListing(url: string): Promise<RawListingData | null> {
    const html = await this.fetchWithRetry(url);
    const $ = cheerio.load(html);
    const { selectors } = this.config;

    const text = (sel: string | undefined): string | undefined => {
      if (!sel) return undefined;
      const val = $(sel).first().text().trim();
      return val || undefined;
    };

    const images = (sel: string | undefined): string[] => {
      if (!sel) return [];
      const imgs: string[] = [];
      $(sel).each((_i, el) => {
        const src = $(el).attr('src') ?? $(el).attr('data-src');
        if (src)
          imgs.push(src.startsWith('http') ? src : new URL(src, this.config.website).toString());
      });
      return imgs;
    };

    return {
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
  }

  // ── Cleanup ──

  async close(): Promise<void> {
    if (this.filterStats) {
      logFilterStats(this.filterStats, this.log);
      this.filterStats = undefined;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = undefined;
    }
    if (this.browser) {
      this.browser.close().catch(() => {});
      this.browser = undefined;
    }
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
