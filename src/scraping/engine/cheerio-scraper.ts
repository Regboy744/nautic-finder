import * as cheerio from 'cheerio';
import type { Logger } from 'pino';
import type { BrokerConfig, RawListingData } from '../types.js';
import { ScraperBase } from './scraper-base.js';

/**
 * Cheerio-based scraper for static HTML pages.
 * Fast and lightweight — no browser required.
 * Use for broker sites that don't rely on JavaScript rendering.
 */
export class CheerioScraper extends ScraperBase {
  constructor(config: BrokerConfig, log: Logger) {
    super(config, log);
  }

  /**
   * Fetches HTML content using native fetch().
   */
  protected async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.config.headers?.['User-Agent'] ?? 'NauticFinder/1.0',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        ...this.config.headers,
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
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
        if (src)
          imgs.push(src.startsWith('http') ? src : new URL(src, this.config.website).toString());
      });
      return imgs;
    };

    // Extract external ID from URL (last path segment or query param)
    const externalId = extractExternalId(url);

    const raw: RawListingData = {
      sourceUrl: url,
      sourcePlatform: this.config.name.toLowerCase().replace(/\s+/g, '-'),
      externalId,
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
      if (/\d/.test(segments[i])) return segments[i];
    }

    return undefined;
  } catch {
    return undefined;
  }
}
