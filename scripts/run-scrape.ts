/**
 * Full scrape-and-save script.
 *
 * Usage:
 *   docker compose up scraper -d --build
 *   pnpm scrape:run                      # 3 pages (default)
 *   pnpm scrape:run -- --pages 5         # 5 pages
 *
 * Flow: Playwright (Docker) → extract → normalize → upsert to Supabase
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import pino from 'pino';

// Load .env
const envPath = resolve(import.meta.dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // No .env file
}

import type { AppConfig } from '../src/config/env.js';
import { createProxyService } from '../src/shared/services/proxy/proxy.service.js';
import { PlaywrightScraper } from '../src/scraping/engine/playwright-scraper.js';
import { yachtworldConfig } from '../src/scraping/brokers/yachtworld/config.js';
import { normalizeListing } from '../src/scraping/normalizers/orchestrator.js';
import { createDatabase } from '../src/shared/db/client.js';
import { createListingsRepository } from '../src/services/catalog/repositories/listings.repository.js';
import { createModelsRepository } from '../src/services/catalog/repositories/models.repository.js';
import { createPriceHistoryRepository } from '../src/services/catalog/repositories/price-history.repository.js';
import { createListingsService } from '../src/services/catalog/services/listings.service.js';
import type { BrokerConfig, RawListingData } from '../src/scraping/types.js';

class RunnableScraper extends PlaywrightScraper {
  listUrls(): Promise<string[]> {
    return this.collectListingUrls();
  }
  detail(url: string): Promise<RawListingData | null> {
    return this.scrapeListing(url);
  }
}

const log = pino({ level: 'info', transport: { target: 'pino-pretty' } });

// Parse CLI args
// Default: 3 pages. Use --pages 0 for all pages.
const maxPages = (() => {
  const idx = process.argv.indexOf('--pages');
  if (idx !== -1 && process.argv[idx + 1]) {
    return parseInt(process.argv[idx + 1], 10);
  }
  return 3;
})();

function buildConfig(): AppConfig {
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
    database: {
      url: env.DATABASE_URL ?? '',
      supabaseUrl: env.SUPABASE_URL ?? '',
      supabaseAnonKey: env.SUPABASE_ANON_KEY ?? '',
      supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
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

function discoverWsEndpoint(): string {
  try {
    const logs = execSync('docker logs nauticfinder-scraper 2>&1', {
      encoding: 'utf8',
      timeout: 5000,
    });
    const lines = logs.split('\n').filter((l) => l.includes('Host connect:'));
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      const match = lastLine.match(/(ws:\/\/\S+)/);
      if (match) return match[1];
    }
  } catch {
    // Ignore
  }

  try {
    const endpoint = execSync(
      'docker exec nauticfinder-scraper cat /tmp/browser-ws-endpoint 2>/dev/null',
      { encoding: 'utf8', timeout: 5000 },
    ).trim();
    if (endpoint.startsWith('ws://')) return endpoint;
  } catch {
    // Ignore
  }

  throw new Error('Cannot find browser WS endpoint. Is Docker scraper running?');
}

async function main(): Promise<void> {
  const config = buildConfig();

  if (!config.database.url || config.database.url.includes('[YOUR-DB-PASSWORD]')) {
    log.error('DATABASE_URL not configured. Set it in .env');
    process.exit(1);
  }

  log.info({ maxPages: maxPages === 0 ? 'all' : maxPages }, '=== NauticFinder Scrape & Save ===');

  // 1. Connect to database
  log.info('Connecting to database...');
  const { db, disconnect } = createDatabase({ url: config.database.url });

  // 2. Set up services
  const listingsRepo = createListingsRepository(db);
  const modelsRepo = createModelsRepository(db);
  const priceHistoryRepo = createPriceHistoryRepository(db);
  const listingsService = createListingsService({
    listingsRepo,
    priceHistoryRepo,
    modelsRepo,
    log,
  });

  // 3. Set up proxy
  const proxyService = createProxyService(config);
  let proxyUrl: string | undefined;
  if (proxyService.isEnabled) {
    const creds = proxyService.buildCredentialsForBroker('YachtWorld');
    proxyUrl = creds.url;
    log.info({ proxyServer: creds.serverArg }, 'Proxy enabled');
  }

  // 4. Set up scraper
  const wsEndpoint = discoverWsEndpoint();
  log.info({ wsEndpoint }, 'Browser endpoint discovered');

  // maxPages=0 means use broker's default (all pages)
  const effectiveMaxPages =
    maxPages > 0 ? maxPages : (yachtworldConfig.selectors.pagination?.maxPages ?? 100);

  const scraperConfig: BrokerConfig = {
    ...yachtworldConfig,
    rateLimit: { ...yachtworldConfig.rateLimit, delayMs: 1_500 },
    selectors: {
      ...yachtworldConfig.selectors,
      pagination: { ...yachtworldConfig.selectors.pagination, maxPages: effectiveMaxPages },
    },
  };

  const scraper = new RunnableScraper(scraperConfig, log, { wsEndpoint, proxyUrl });

  try {
    // 5. Collect listing URLs (limited pages)
    log.info({ effectiveMaxPages }, 'Collecting listing URLs...');
    const urls = await scraper.listUrls();
    log.info({ found: urls.length }, 'Listing URLs collected');

    if (urls.length === 0) {
      log.warn('No listings found. Cloudflare may be blocking.');
      return;
    }

    // 6. Scrape each detail page, normalize, save to DB immediately
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        log.info({ progress: `${i + 1}/${urls.length}` }, 'Scraping');

        const raw = await scraper.detail(url);
        if (!raw) {
          errorCount++;
          continue;
        }

        const normalized = normalizeListing(raw);
        const { listing, isNew } = await listingsService.upsert(
          normalized as Parameters<typeof listingsService.upsert>[0],
        );

        if (isNew) {
          newCount++;
          log.info({ id: listing.id, title: listing.title, price: listing.price }, 'SAVED');
        } else {
          updatedCount++;
          log.info({ id: listing.id }, 'UPDATED');
        }
      } catch (err) {
        errorCount++;
        const msg = err instanceof Error ? err.message : String(err);
        log.error({ url, error: msg }, 'FAILED');
      }
    }

    log.info(
      { total: urls.length, new: newCount, updated: updatedCount, errors: errorCount },
      '=== Scrape complete ===',
    );
  } finally {
    await scraper.close();
    await disconnect();
  }
}

main().catch((err) => {
  log.fatal(err, 'Scrape failed');
  process.exit(1);
});
