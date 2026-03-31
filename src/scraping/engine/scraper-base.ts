import type { Logger } from 'pino';
import type { BrokerConfig, RawListingData, ScrapeRunResult } from '../types.js';

/**
 * Abstract base class for all scrapers.
 * Provides retry logic, rate limiting, and a standard interface.
 * Concrete implementations (Cheerio, Playwright) override fetchPage() and extractListings().
 */
export abstract class ScraperBase {
  protected config: BrokerConfig;
  protected log: Logger;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(config: BrokerConfig, log: Logger) {
    this.config = config;
    this.log = log;
  }

  /**
   * Runs a full scrape of the broker's listings.
   * Iterates through search pages, extracts listing URLs, scrapes each detail page.
   */
  async run(): Promise<ScrapeRunResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let totalPages = 0;
    const listings: RawListingData[] = [];

    this.log.info({ broker: this.config.name }, 'Starting scrape run');

    try {
      // Phase 1: Collect listing URLs from search pages
      const listingUrls = await this.collectListingUrls();
      totalPages = Math.ceil(listingUrls.length / 20); // approximate

      this.log.info(
        { broker: this.config.name, urlCount: listingUrls.length },
        'Collected listing URLs',
      );

      // Phase 2: Scrape each listing detail page
      for (const url of listingUrls) {
        try {
          await this.enforceRateLimit();
          const listing = await this.scrapeListing(url);
          if (listing) listings.push(listing);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push(`${url}: ${message}`);
          this.log.warn({ url, err: message }, 'Failed to scrape listing');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Fatal: ${message}`);
      this.log.error({ err }, 'Scrape run failed');
    }

    const result: ScrapeRunResult = {
      brokerName: this.config.name,
      startedAt,
      completedAt: new Date(),
      totalPages,
      totalListings: listings.length,
      newListings: 0, // Filled in by the caller after upsert
      updatedListings: 0,
      errors: errors.length,
      errorMessages: errors.slice(0, 50), // Cap error messages
    };

    this.log.info(
      {
        broker: this.config.name,
        listings: result.totalListings,
        errors: result.errors,
        durationMs: result.completedAt.getTime() - result.startedAt.getTime(),
      },
      'Scrape run completed',
    );

    return result;
  }

  /**
   * Enforces rate limiting between requests with human-like jitter.
   * Adds random variation (0–50% of delayMs) to avoid metronomic patterns.
   */
  private async enforceRateLimit(): Promise<void> {
    const { delayMs } = this.config.rateLimit;
    const jitter = Math.floor(Math.random() * delayMs * 0.5);
    const targetDelay = delayMs + jitter;
    const elapsed = Date.now() - this.lastRequestTime;

    if (elapsed < targetDelay) {
      const waitMs = targetDelay - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Fetches a URL with retry logic and exponential backoff.
   */
  protected async fetchWithRetry(url: string, maxRetries = 5): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.enforceRateLimit();
        return await this.fetchPage(url);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const baseBackoff = Math.min(1000 * Math.pow(2, attempt), 30_000);
        const jitter = Math.floor(Math.random() * baseBackoff * 0.3);
        const backoffMs = baseBackoff + jitter;
        this.log.warn({ url, attempt, maxRetries, backoffMs }, 'Fetch failed, retrying');
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
  }

  /**
   * Collects all listing detail URLs from paginated search pages.
   */
  protected abstract collectListingUrls(): Promise<string[]>;

  /**
   * Scrapes a single listing detail page and returns raw data.
   */
  protected abstract scrapeListing(url: string): Promise<RawListingData | null>;

  /**
   * Fetches the HTML content of a page. Implemented by subclasses.
   */
  protected abstract fetchPage(url: string): Promise<string>;
}
