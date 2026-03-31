import { readFileSync } from 'node:fs';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { CheerioScraper } from '../../../src/scraping/engine/cheerio-scraper.js';
import { yachtworldConfig } from '../../../src/scraping/brokers/yachtworld/config.js';
import type { BrokerConfig, RawListingData } from '../../../src/scraping/types.js';

const listFixture = readFileSync(
  new URL('../../../src/scraping/brokers/yachtworld/fixtures/list.html', import.meta.url),
  'utf8',
);

const detailFixture = readFileSync(
  new URL('../../../src/scraping/brokers/yachtworld/fixtures/detail.html', import.meta.url),
  'utf8',
);

class FixtureCheerioScraper extends CheerioScraper {
  constructor(
    config: BrokerConfig,
    private readonly fixtureByUrl: Record<string, string>,
  ) {
    super(config, pino({ level: 'silent' }));
  }

  protected override fetchPage(url: string): Promise<string> {
    const fixture = this.fixtureByUrl[url];
    if (!fixture) {
      throw new Error(`Missing fixture for URL: ${url}`);
    }

    return Promise.resolve(fixture);
  }

  async runCollectListingUrls(): Promise<string[]> {
    return this.collectListingUrls();
  }

  async runScrapeListing(url: string): Promise<RawListingData | null> {
    return this.scrapeListing(url);
  }
}

function buildPageUrl(config: BrokerConfig, page: number): string {
  const pageTemplate = config.selectors.pagination?.pageUrlTemplate;
  if (pageTemplate) {
    return pageTemplate.replace('{page}', String(page));
  }

  return `${config.selectors.searchUrl}?page=${page}`;
}

describe('YachtWorld Cheerio scraper fixtures', () => {
  it('collects listing URLs from the real list fixture', async () => {
    const config: BrokerConfig = {
      ...yachtworldConfig,
      selectors: {
        ...yachtworldConfig.selectors,
        pagination: {
          ...yachtworldConfig.selectors.pagination,
          maxPages: 2,
        },
      },
    };

    const page1Url = buildPageUrl(config, 1);
    const page2Url = buildPageUrl(config, 2);

    const scraper = new FixtureCheerioScraper(config, {
      [page1Url]: listFixture,
      [page2Url]: '<html><body><div>No cards</div></body></html>',
    });

    const urls = await scraper.runCollectListingUrls();

    expect(urls.length).toBeGreaterThan(10);
    expect(urls).toContain('https://www.yachtworld.com/yacht/2024-sirena-88-9759212/');
    expect(urls.every((url) => url.startsWith('https://www.yachtworld.com/yacht/'))).toBe(true);
  });

  it('extracts key fields from the real detail fixture', async () => {
    const detailUrl = 'https://www.yachtworld.com/yacht/2024-sirena-88-9759212/';
    const scraper = new FixtureCheerioScraper(yachtworldConfig, {
      [detailUrl]: detailFixture,
    });

    const raw = await scraper.runScrapeListing(detailUrl);

    expect(raw).not.toBeNull();
    expect(raw?.externalId).toBe('9759212');
    expect(raw?.title).toContain('2024 Sirena 88');
    expect(raw?.year).toBe('2024');
    expect(raw?.make).toBe('Sirena');
    expect(raw?.model).toBe('88');
    expect(raw?.boatType).toBe('Motor Yacht');
    expect(raw?.location).toContain('Athens');
    expect(raw?.price).toBe('5999921.74');
    expect(raw?.currency).toBe('GBP');
    expect(raw?.description).toContain('Heliophilia is a great opportunity');
    expect(raw?.imageUrls?.length ?? 0).toBeGreaterThan(10);
    expect(raw?.lengthFt).toBe('26.82m');
    expect(raw?.beamFt).toBe('7.09m');
    expect(raw?.draftFt).toBe('1.85m');
    expect(raw?.hullMaterial).toBe('Fibreglass');
    expect(raw?.engineMake).toBe('MAN');
    expect(raw?.engineModel).toBe('V12');
    expect(raw?.engineHp).toBe('1550hp');
    expect(raw?.engineHours).toBe('70');
    expect(raw?.cabins).toBe('4');
    expect(raw?.brokerName).toContain('Denison');
    expect(raw?.brokerPhone).toContain('+377');
  });
});
