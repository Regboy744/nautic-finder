/**
 * Proxy configuration — validation and broker policy map.
 *
 * Unlike retailCtrl, this reads from AppConfig.proxy (already parsed by Zod)
 * instead of raw env vars. Validated and frozen at build time.
 */

import type { AppConfig } from '../../../config/env.js';
import type { ProxyConfig, ProxyPolicy } from './proxy.types.js';

// ============ Build Config from AppConfig ============

export function buildProxyConfig(appConfig: AppConfig): ProxyConfig {
  const p = appConfig.proxy;

  if (!p.enabled) {
    return Object.freeze({
      enabled: false,
      mode: 'ip_whitelist' as const,
      host: 'gate.decodo.com',
      port: 7000,
      username: '',
      password: '',
      protocol: 'http' as const,
      country: undefined,
      sessionStrategy: 'rotate' as const,
      sessionDurationMin: 30,
      sessionIdStrategy: 'per_job' as const,
      timeoutMs: 30_000,
    });
  }

  // Fail fast: userpass mode requires credentials.
  if (p.mode === 'userpass') {
    if (!p.username || !p.password) {
      throw new Error(
        '[ProxyConfig] DECODO_PROXY_USERNAME and DECODO_PROXY_PASSWORD are required when mode is "userpass".',
      );
    }
  }

  return Object.freeze({
    enabled: true,
    mode: p.mode,
    host: p.host,
    port: p.port,
    username: p.username,
    password: p.password,
    protocol: p.protocol,
    country: p.country || undefined,
    sessionStrategy: p.sessionStrategy,
    sessionDurationMin: p.sessionDurationMin,
    sessionIdStrategy: p.sessionIdStrategy,
    timeoutMs: p.timeoutMs,
  });
}

// ============ Broker Proxy Policies ============

/**
 * Per-broker proxy policy overrides.
 * Brokers not in this map fall back to the global ProxyConfig defaults.
 */
export const brokerProxyPolicies: Record<string, ProxyPolicy> = {
  YachtWorld: {
    sessionStrategy: 'rotate',
    sessionDurationMin: 0,
    sessionIdStrategy: 'per_job',
  },
};

// ============ Masking Utility ============

/**
 * Mask a string for safe logging.
 * Shows first 4 chars + last 2 chars, rest replaced with ***.
 */
export function maskString(value: string): string {
  if (value.length <= 6) return '***';
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}

/**
 * Return a log-safe representation of proxy credentials.
 * Never includes the raw password.
 */
export function safeCredentialsSummary(host: string, port: number, username?: string): string {
  const userPart = username ? `user=${maskString(username)}@` : '';
  return `${userPart}${host}:${port}`;
}
