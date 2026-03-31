/**
 * Proxy module public API.
 *
 * Import from here — never import internal files directly.
 */

// Types (re-exported for consumers)
export type {
  ProxyConfig,
  ProxyCredentials,
  ProxyMode,
  ProxyOptions,
  ProxyPolicy,
  ProxyRetryOptions,
  ProxySessionIdStrategy,
  ProxySessionStrategy,
  ProxyTestResult,
} from './proxy.types.js';

// Config utilities
export {
  brokerProxyPolicies,
  buildProxyConfig,
  maskString,
  safeCredentialsSummary,
} from './proxy.config.js';

// Service
export { createProxyService, ProxyService } from './proxy.service.js';
