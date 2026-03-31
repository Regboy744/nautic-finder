import type { BrokerConfig } from '../types.js';
import { yachtworldConfig } from '../brokers/yachtworld/config.js';

/**
 * Registry of all broker scraper configurations.
 * Add new configs here to enable scraping for new broker websites.
 */
export const BROKER_CONFIGS: Record<string, BrokerConfig> = {
  yachtworld: yachtworldConfig,
};

/** Returns all enabled broker configs. */
export function getEnabledBrokerConfigs(): BrokerConfig[] {
  return Object.values(BROKER_CONFIGS).filter((c) => c.enabled !== false);
}
