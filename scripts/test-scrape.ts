/**
 * Smoke test script for live scraping with proxy + stealth.
 *
 * Usage:
 *   pnpm scrape:test
 *
 * Requires DECODO_PROXY_* env vars set in .env (or exported).
 * Tests:
 *   1. Proxy connectivity (exit IP)
 *   2. YachtWorld list page fetch (200 + has listings)
 *   3. YachtWorld detail page extraction (1 listing)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pino from 'pino';

// Load .env file into process.env before anything else
const envPath = resolve(import.meta.dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip inline comments (but not inside values with # in them like passwords)
    const commentIndex = value.indexOf(' #');
    if (commentIndex > 0) value = value.slice(0, commentIndex).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // No .env file — rely on exported env vars
}

import type { AppConfig } from '../src/config/env.js';
import { createProxyService } from '../src/shared/services/proxy/proxy.service.js';
import { CheerioScraper } from '../src/scraping/engine/cheerio-scraper.js';
import { PlaywrightScraper } from '../src/scraping/engine/playwright-scraper.js';
import { yachtworldConfig } from '../src/scraping/brokers/yachtworld/config.js';
import type { BrokerConfig, RawListingData } from '../src/scraping/types.js';

interface TestableScraperInterface {
  listUrls(): Promise<string[]>;
  detail(url: string): Promise<RawListingData | null>;
  close?(): Promise<void>;
}

class CheerioTestScraper extends CheerioScraper implements TestableScraperInterface {
  listUrls(): Promise<string[]> {
    return this.collectListingUrls();
  }
  detail(url: string): Promise<RawListingData | null> {
    return this.scrapeListing(url);
  }
}

class PlaywrightTestScraper extends PlaywrightScraper implements TestableScraperInterface {
  listUrls(): Promise<string[]> {
    return this.collectListingUrls();
  }
  detail(url: string): Promise<RawListingData | null> {
    return this.scrapeListing(url);
  }
}

const log = pino({ level: 'info', transport: { target: 'pino-pretty' } });

/**
 * Build a minimal config from env vars — only proxy section is needed
 * for the scrape test. This avoids requiring DATABASE_URL, GEMINI_API_KEY, etc.
 */
function buildScrapeTestConfig(): AppConfig {
  const env = process.env;
  return {
    app: {
      nodeEnv: 'development',
      port: 0,
      logLevel: 'info',
      corsOrigin: '',
      isProduction: false,
      isDevelopment: true,
      isTest: false,
    },
    database: { url: '', supabaseUrl: '', supabaseAnonKey: '', supabaseServiceRoleKey: '' },
    redis: { url: '', keyPrefix: 'nf:' },
    ai: { geminiApiKey: '', anthropicApiKey: '', openaiApiKey: '' },
    scraping: { proxyUrl: '', userAgent: 'NauticFinder/1.0', concurrency: 1 },
    currency: { exchangeRateApiKey: '', cacheTtlSeconds: 3600 },
    notification: { resendApiKey: '', vapidPublicKey: '', vapidPrivateKey: '' },
    auth: { jwtSecret: '' },
    proxy: {
      enabled: env.DECODO_PROXY_ENABLED === 'true',
      mode: (env.DECODO_PROXY_MODE as 'ip_whitelist' | 'userpass') ?? 'ip_whitelist',
      host: env.DECODO_PROXY_HOST ?? 'gate.decodo.com',
      port: parseInt(env.DECODO_PROXY_PORT ?? '7000', 10),
      username: env.DECODO_PROXY_USERNAME ?? '',
      password: env.DECODO_PROXY_PASSWORD ?? '',
      protocol: (env.DECODO_PROXY_PROTOCOL as 'http' | 'https') ?? 'http',
      country: env.DECODO_PROXY_COUNTRY ?? '',
      sessionStrategy: (env.DECODO_PROXY_SESSION_STRATEGY as 'rotate' | 'sticky') ?? 'rotate',
      sessionDurationMin: parseInt(env.DECODO_PROXY_SESSION_DURATION_MIN ?? '30', 10),
      sessionIdStrategy:
        (env.DECODO_PROXY_SESSION_ID_STRATEGY as 'per_job' | 'per_broker') ?? 'per_job',
      timeoutMs: parseInt(env.DECODO_PROXY_TIMEOUT_MS ?? '30000', 10),
    },
  };
}

/**
 * Discover the Playwright WebSocket endpoint from the Docker container logs.
 * The browser server prints "Host connect: ws://localhost:3001/<guid>" on startup.
 */
async function discoverWsEndpoint(logger: pino.Logger): Promise<string> {
  const { execSync } = await import('node:child_process');
  try {
    const logs = execSync('docker logs nauticfinder-scraper 2>&1', {
      encoding: 'utf8',
      timeout: 5000,
    });
    // Find the last "Host connect: ws://..." line
    const lines = logs.split('\n').filter((l) => l.includes('Host connect:'));
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      const match = lastLine.match(/(ws:\/\/\S+)/);
      if (match) return match[1];
    }
  } catch (err) {
    logger.warn({ err }, 'Could not read Docker container logs');
  }

  // Fallback: try fetching the endpoint file via docker exec
  try {
    const endpoint = execSync(
      'docker exec nauticfinder-scraper cat /tmp/browser-ws-endpoint 2>/dev/null',
      { encoding: 'utf8', timeout: 5000 },
    ).trim();
    if (endpoint.startsWith('ws://')) return endpoint;
  } catch {
    // Ignore
  }

  throw new Error(
    'Could not discover browser WebSocket endpoint. ' +
      'Is the scraper container running? Try: docker compose up scraper -d --build\n' +
      'Or set BROWSER_WS_ENDPOINT env var manually.',
  );
}

async function main(): Promise<void> {
  log.info('=== NauticFinder Scrape Smoke Test ===');

  const config = buildScrapeTestConfig();

  // Step 1: Test proxy connectivity
  log.info('--- Step 1: Proxy connectivity ---');
  const proxyService = createProxyService(config);

  if (!proxyService.isEnabled) {
    log.warn('Proxy is DISABLED. Set DECODO_PROXY_ENABLED=true in .env');
    log.info('Continuing without proxy...');
  } else {
    log.info(proxyService.getConfigSummary(), 'Proxy config');
    const testResult = await proxyService.testConnection();
    if (testResult.ok) {
      log.info(
        {
          ip: testResult.ip,
          country: testResult.country,
          city: testResult.city,
          latencyMs: testResult.latencyMs,
        },
        'Proxy test PASSED',
      );
    } else {
      log.error({ error: testResult.error }, 'Proxy test FAILED');
      process.exit(1);
    }
  }

  // Step 2: Fetch YachtWorld list page
  log.info('--- Step 2: YachtWorld list page ---');
  const scraperConfig: BrokerConfig = {
    ...yachtworldConfig,
    rateLimit: { ...yachtworldConfig.rateLimit, delayMs: 500 },
    selectors: {
      ...yachtworldConfig.selectors,
      pagination: { ...yachtworldConfig.selectors.pagination, maxPages: 1 },
    },
  };

  let scraper: TestableScraperInterface;

  if (scraperConfig.scraperType === 'playwright') {
    // Playwright: connect to Docker browser
    // The WS endpoint includes a GUID path that changes each launch.
    // Set BROWSER_WS_ENDPOINT env var, or we'll auto-discover from container logs.
    let wsEndpoint = process.env.BROWSER_WS_ENDPOINT ?? '';
    if (!wsEndpoint) {
      wsEndpoint = await discoverWsEndpoint(log);
    }
    log.info({ wsEndpoint }, 'Using PlaywrightScraper (Docker browser)');

    let proxyUrl: string | undefined;
    if (proxyService.isEnabled) {
      const creds = proxyService.buildCredentialsForBroker(scraperConfig.name);
      proxyUrl = creds.url;
      log.info({ proxyServer: creds.serverArg }, 'Proxy credentials built for Playwright');
    }

    scraper = new PlaywrightTestScraper(scraperConfig, log, {
      wsEndpoint,
      proxyUrl,
    });
  } else {
    // Cheerio: direct HTTP with optional proxy agent
    log.info('Using CheerioScraper');
    const agent = proxyService.isEnabled ? proxyService.getHttpAgent() : undefined;
    scraper = new CheerioTestScraper(scraperConfig, log, { proxyAgent: agent });
  }

  const urls = await scraper.listUrls();
  log.info({ found: urls.length, sample: urls.slice(0, 3) }, 'List page results');

  if (urls.length === 0) {
    log.error('No listing URLs found. The site may still be blocking requests.');
    if (scraper.close) await scraper.close();
    process.exit(1);
  }

  // Step 3: Scrape one detail page
  log.info('--- Step 3: Detail page extraction ---');
  const detailUrl = urls[0];
  const raw = await scraper.detail(detailUrl);

  if (!raw) {
    log.error({ url: detailUrl }, 'Failed to extract listing data');
    process.exit(1);
  }

  log.info(
    {
      externalId: raw.externalId,
      title: raw.title,
      price: raw.price,
      currency: raw.currency,
      year: raw.year,
      make: raw.make,
      model: raw.model,
      location: raw.location,
      images: raw.imageUrls?.length ?? 0,
      brokerName: raw.brokerName,
    },
    'Detail page extraction PASSED',
  );

  // Cleanup
  if (scraper.close) await scraper.close();

  log.info('=== All smoke tests passed ===');
}

main().catch((err) => {
  log.fatal(err, 'Smoke test failed');
  process.exit(1);
});
