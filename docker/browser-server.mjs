/**
 * Playwright browser server — runs inside Docker.
 * Clean Chromium, no proxy. Proxy is set per-context by the host script.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const PORT = parseInt(process.env.BROWSER_PORT || '3001', 10);

const server = await chromium.launchServer({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled',
  ],
  port: PORT,
  host: '0.0.0.0',
});

const wsEndpoint = server.wsEndpoint().replace('0.0.0.0', 'localhost');
console.log(`[browser-server] Ready: ${wsEndpoint}`);

try {
  writeFileSync('/tmp/browser-ws-endpoint', wsEndpoint);
} catch {
  /* ok */
}

const shutdown = async () => {
  await server.close().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
