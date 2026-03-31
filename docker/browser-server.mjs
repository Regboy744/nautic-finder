/**
 * Playwright browser server — runs inside Docker.
 *
 * The proxy is set at the BROWSER level (--proxy-server flag) so it applies
 * to all connections. The host client provides proxy credentials via
 * context httpCredentials.
 *
 * After the client disconnects, the server restarts with a fresh browser
 * to avoid stale state between scrape runs.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const PORT = parseInt(process.env.BROWSER_PORT || '3001', 10);
const PROXY_SERVER = process.env.PROXY_SERVER || '';

async function startServer() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled',
  ];

  if (PROXY_SERVER) {
    args.push(`--proxy-server=${PROXY_SERVER}`);
    console.log(`[browser-server] Proxy: ${PROXY_SERVER}`);
  }

  const server = await chromium.launchServer({
    headless: true,
    args,
    port: PORT,
    host: '0.0.0.0',
  });

  const wsEndpoint = server.wsEndpoint();
  const hostEndpoint = wsEndpoint.replace('0.0.0.0', 'localhost');

  console.log(`[browser-server] Ready: ${hostEndpoint}`);

  try {
    writeFileSync('/tmp/browser-ws-endpoint', hostEndpoint);
  } catch {
    // Not critical
  }

  // When the client disconnects, restart with a fresh browser.
  server.on('close', () => {
    console.log('[browser-server] Browser closed, restarting fresh...');
    setTimeout(() => startServer().catch(fatal), 500);
  });

  return server;
}

function fatal(err) {
  console.error('[browser-server] Fatal:', err);
  process.exit(1);
}

let currentServer = null;

const shutdown = async () => {
  console.log('[browser-server] Shutting down...');
  if (currentServer) await currentServer.close().catch(() => {});
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer()
  .then((s) => {
    currentServer = s;
  })
  .catch(fatal);
