/**
 * Proxy Service — single source of truth for proxy credentials,
 * session management, testing, and retry logic.
 *
 * Adapted from retailCtrl. Differences:
 * - No Puppeteer/browser path (Cheerio only)
 * - Config comes from AppConfig (Zod-parsed), not raw env
 * - Session scope: per_job | per_broker (no per_browser)
 */

import { randomUUID } from 'node:crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type { AppConfig } from '../../../config/env.js';
import { buildProxyConfig, brokerProxyPolicies, safeCredentialsSummary } from './proxy.config.js';
import type {
  ProxyConfig,
  ProxyCredentials,
  ProxyOptions,
  ProxyPolicy,
  ProxyRetryOptions,
  ProxyTestResult,
} from './proxy.types.js';

// ============ Session ID Management ============

const sessionIdStore = new Map<string, string>();

function sessionCacheKey(
  strategy: 'per_job' | 'per_broker',
  brokerKey?: string,
  jobId?: string,
): string {
  switch (strategy) {
    case 'per_job':
      return `job:${jobId ?? randomUUID()}`;
    case 'per_broker':
      return `broker:${brokerKey ?? 'default'}`;
  }
}

function getOrCreateSessionId(cacheKey: string): string {
  let id = sessionIdStore.get(cacheKey);
  if (!id) {
    id = randomUUID().replace(/-/g, '').slice(0, 16);
    sessionIdStore.set(cacheKey, id);
  }
  return id;
}

function rotateSessionId(cacheKey: string): string {
  const newId = randomUUID().replace(/-/g, '').slice(0, 16);
  sessionIdStore.set(cacheKey, newId);
  return newId;
}

// ============ HTTP Agent Cache ============

const agentCache = new Map<string, HttpsProxyAgent<string>>();

function getOrCreateAgent(proxyUrl: string): HttpsProxyAgent<string> {
  let agent = agentCache.get(proxyUrl);
  if (!agent) {
    agent = new HttpsProxyAgent(proxyUrl);
    agentCache.set(proxyUrl, agent);
  }
  return agent;
}

// ============ Proxy Service ============

export class ProxyService {
  private readonly config: ProxyConfig;

  constructor(appConfig: AppConfig) {
    this.config = buildProxyConfig(appConfig);
  }

  /**
   * Build proxy credentials from options + global config.
   *
   * In `userpass` mode the Decodo-style username encodes session parameters:
   *   <BASE_USER>-sessionduration-<MIN>-session-<ID>-country-<CC>
   *
   * In `ip_whitelist` mode no credentials are needed.
   */
  buildCredentials(options?: ProxyOptions): ProxyCredentials {
    const cfg = this.config;

    if (!cfg.enabled) {
      throw new Error('[ProxyService] Cannot build credentials — proxy is disabled.');
    }

    const serverArg = `${cfg.host}:${cfg.port}`;

    if (cfg.mode === 'ip_whitelist') {
      return {
        serverArg,
        url: `${cfg.protocol}://${cfg.host}:${cfg.port}`,
        requiresAuth: false,
      };
    }

    // ---- userpass mode: build enriched username ----
    const sticky = options?.sticky ?? cfg.sessionStrategy === 'sticky';
    const durationMin = options?.sessionDurationMin ?? cfg.sessionDurationMin;
    const country = options?.country ?? cfg.country;

    let enrichedUser = cfg.username;

    if (sticky && durationMin > 0) {
      enrichedUser += `-sessionduration-${durationMin}`;
    }

    if (sticky) {
      const sessionId =
        options?.sessionId ??
        getOrCreateSessionId(
          sessionCacheKey(cfg.sessionIdStrategy, options?.brokerKey, options?.jobId),
        );
      enrichedUser += `-session-${sessionId}`;
    }

    if (country) {
      enrichedUser += `-country-${country}`;
    }

    const encodedPassword = encodeURIComponent(cfg.password);
    const encodedUser = encodeURIComponent(enrichedUser);
    const url = `${cfg.protocol}://${encodedUser}:${encodedPassword}@${cfg.host}:${cfg.port}`;

    return {
      serverArg,
      url,
      username: enrichedUser,
      password: cfg.password,
      requiresAuth: true,
    };
  }

  /**
   * Build credentials using the broker's policy from the central map.
   */
  buildCredentialsForBroker(brokerKey: string, jobId?: string): ProxyCredentials {
    const policy: ProxyPolicy | undefined = brokerProxyPolicies[brokerKey];

    return this.buildCredentials({
      sticky: policy?.sessionStrategy === 'sticky',
      sessionDurationMin: policy?.sessionDurationMin,
      country: policy?.country,
      brokerKey,
      jobId,
    });
  }

  /**
   * Test proxy connectivity by hitting https://ip.decodo.com/json.
   */
  async testConnection(options?: ProxyOptions): Promise<ProxyTestResult> {
    const cfg = this.config;
    const startMs = Date.now();

    if (!cfg.enabled) {
      return { ok: false, error: 'Proxy is disabled', latencyMs: 0 };
    }

    try {
      const creds = this.buildCredentials(options);
      const agent = getOrCreateAgent(creds.url);

      const response = await fetch('https://ip.decodo.com/json', {
        // @ts-expect-error -- Node fetch supports agent via dispatcher
        agent,
        signal: AbortSignal.timeout(cfg.timeoutMs),
      });

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status} ${response.statusText}`,
          latencyMs: Date.now() - startMs,
        };
      }

      const data = (await response.json()) as Record<string, unknown>;

      return {
        ok: true,
        ip: (data.ip as string | undefined) ?? (data.query as string | undefined) ?? undefined,
        country: (data.country as string | undefined) ?? undefined,
        city: (data.city as string | undefined) ?? undefined,
        asn: (data.as as string | undefined) ?? (data.asn as string | undefined) ?? undefined,
        latencyMs: Date.now() - startMs,
      };
    } catch (err) {
      const error = err as Error;
      return { ok: false, error: error.message, latencyMs: Date.now() - startMs };
    }
  }

  /**
   * Generic retry wrapper that handles proxy-specific failures.
   * On 407 / ECONNRESET / ETIMEDOUT it retries with exponential backoff + jitter.
   * Rotates session ID mid-way when `rotateSessionOnFailure` is true.
   */
  async withRetry<T>(fn: () => Promise<T>, options?: ProxyRetryOptions): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelay = options?.baseDelayMs ?? 1_000;
    const maxDelay = options?.maxDelayMs ?? 10_000;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        const isRetryable = this.isRetryableError(lastError);

        if (!isRetryable || attempt === maxRetries) {
          break;
        }

        // Rotate session mid-way through retries if configured.
        if (
          options?.rotateSessionOnFailure &&
          attempt >= Math.ceil(maxRetries / 2) &&
          options.brokerKey
        ) {
          const key = sessionCacheKey(
            this.config.sessionIdStrategy,
            options.brokerKey,
            options.jobId,
          );
          rotateSessionId(key);
        }

        // Exponential backoff with jitter.
        const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
        const jitter = Math.floor(Math.random() * delay * 0.3);
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      }
    }

    throw lastError ?? new Error('Retry failed with no error captured');
  }

  /**
   * Get an HttpsProxyAgent for Node-level HTTP requests (cached).
   */
  getHttpAgent(options?: ProxyOptions): HttpsProxyAgent<string> {
    if (!this.config.enabled) {
      throw new Error('[ProxyService] Cannot create HTTP agent — proxy is disabled.');
    }
    const creds = this.buildCredentials(options);
    return getOrCreateAgent(creds.url);
  }

  /** Whether the proxy is currently enabled. */
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /** Clear all cached session IDs (for testing). */
  clearSessions(): void {
    sessionIdStore.clear();
  }

  /** Clear agent cache (for testing / credential rotation). */
  clearAgentCache(): void {
    agentCache.clear();
  }

  /** Log-safe summary of the current config (no secrets). */
  getConfigSummary(): Record<string, unknown> {
    const cfg = this.config;
    return {
      enabled: cfg.enabled,
      mode: cfg.mode,
      endpoint: safeCredentialsSummary(
        cfg.host,
        cfg.port,
        cfg.mode === 'userpass' ? cfg.username : undefined,
      ),
      sessionStrategy: cfg.sessionStrategy,
      sessionIdStrategy: cfg.sessionIdStrategy,
      sessionDurationMin: cfg.sessionDurationMin,
      country: cfg.country ?? 'any',
    };
  }

  // ============ Private Helpers ============

  private isRetryableError(error: Error): boolean {
    const msg = error.message.toLowerCase();
    if (msg.includes('407')) return true;
    if (msg.includes('econnreset')) return true;
    if (msg.includes('econnrefused')) return true;
    if (msg.includes('etimedout')) return true;
    if (msg.includes('timeout')) return true;
    if (msg.includes('socket hang up')) return true;
    if (msg.includes('network')) return true;
    return false;
  }
}

/** Create a ProxyService instance from AppConfig. */
export function createProxyService(appConfig: AppConfig): ProxyService {
  return new ProxyService(appConfig);
}
