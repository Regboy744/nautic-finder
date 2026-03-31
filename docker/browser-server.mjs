/**
 * Playwright browser server — runs inside Docker.
 * Launches a persistent Chromium instance and exposes a WebSocket endpoint.
 *
 * NO proxy at the browser level — proxy is set per-context by the host client
 * via Playwright's context proxy option when connecting.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const PORT = parseInt(process.env.BROWSER_PORT || '3001', 10);

async function main() {
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

  const wsEndpoint = server.wsEndpoint();
  const hostEndpoint = wsEndpoint.replace('0.0.0.0', 'localhost');

  console.log(`[browser-server] Internal: ${wsEndpoint}`);
  console.log(`[browser-server] Host connect: ${hostEndpoint}`);

  try {
    writeFileSync('/tmp/browser-ws-endpoint', hostEndpoint);
  } catch {
    // Not critical
  }

  const shutdown = async () => {
    console.log('[browser-server] Shutting down...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[browser-server] Fatal:', err);
  process.exit(1);
});
