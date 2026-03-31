/**
 * Proxy module types.
 *
 * All proxy-related types live here so the rest of the codebase
 * stays vendor-agnostic. Scrapers never import Decodo-specific details.
 */

// ============ Configuration Types ============

/** Authentication mode for the proxy. */
export type ProxyMode = 'ip_whitelist' | 'userpass';

/** How proxy sessions behave between requests. */
export type ProxySessionStrategy = 'rotate' | 'sticky';

/** Scope at which a sticky session ID is generated. */
export type ProxySessionIdStrategy = 'per_job' | 'per_broker';

/**
 * Full proxy configuration derived from environment variables.
 * Immutable after startup validation.
 */
export interface ProxyConfig {
  readonly enabled: boolean;
  readonly mode: ProxyMode;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly protocol: 'http' | 'https';
  readonly country: string | undefined;
  readonly sessionStrategy: ProxySessionStrategy;
  readonly sessionDurationMin: number;
  readonly sessionIdStrategy: ProxySessionIdStrategy;
  readonly timeoutMs: number;
}

// ============ Per-Broker Policy ============

/**
 * Per-broker proxy behaviour override.
 * Stored in a central map so scrapers stay proxy-agnostic.
 */
export interface ProxyPolicy {
  readonly sessionStrategy: ProxySessionStrategy;
  readonly sessionDurationMin: number;
  readonly sessionIdStrategy: ProxySessionIdStrategy;
  readonly country?: string;
}

// ============ Runtime Options ============

/**
 * Options passed by callers (scrapers, health checks) when
 * requesting proxy credentials. All fields optional —
 * defaults come from ProxyConfig + ProxyPolicy.
 */
export interface ProxyOptions {
  country?: string;
  sessionId?: string;
  sessionDurationMin?: number;
  sticky?: boolean;
  brokerKey?: string;
  jobId?: string;
}

// ============ Proxy Credentials (builder output) ============

/**
 * Resolved proxy credentials ready for HTTP clients.
 */
export interface ProxyCredentials {
  /** `host:port` for proxy server identification. */
  serverArg: string;
  /** Full proxy URL (may contain auth) for HttpsProxyAgent. */
  url: string;
  /** Username with encoded session params. */
  username?: string;
  /** Raw password. Never log this. */
  password?: string;
  /** Whether authentication is needed. */
  requiresAuth: boolean;
}

// ============ Test / Health ============

/**
 * Result of hitting the proxy test endpoint (ip.decodo.com/json).
 */
export interface ProxyTestResult {
  ok: boolean;
  ip?: string;
  country?: string;
  city?: string;
  asn?: string;
  error?: string;
  latencyMs: number;
}

// ============ Retry ============

/**
 * Options for the proxy-aware retry wrapper.
 */
export interface ProxyRetryOptions {
  /** Maximum attempts before giving up (default 3). */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default 1000). */
  baseDelayMs?: number;
  /** Maximum delay cap in ms (default 10_000). */
  maxDelayMs?: number;
  /** Correlation IDs for logging. */
  brokerKey?: string;
  jobId?: string;
  /** Rotate session ID after repeated failures when using sticky sessions. */
  rotateSessionOnFailure?: boolean;
}
