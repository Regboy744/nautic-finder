import pino, { type Logger, type LoggerOptions } from 'pino';

/**
 * Default Pino logger options.
 * In production: JSON output. In dev: pino-pretty.
 */
function getDefaultOptions(level: string, isDev: boolean): LoggerOptions {
  return {
    level,
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss' },
          },
        }
      : {}),
    // Redact sensitive fields from logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'token',
        'apiKey',
        'secret',
      ],
      censor: '[REDACTED]',
    },
    // Consistent timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,
  };
}

/** Root application logger instance (singleton). Created lazily via `initLogger`. */
let rootLogger: Logger | null = null;

/** Configuration for initializing the root logger. */
export interface LoggerConfig {
  level: string;
  isDevelopment: boolean;
}

/**
 * Initializes the root Pino logger. Must be called once at startup.
 * Subsequent calls return the existing instance (idempotent).
 */
export function initLogger(config: LoggerConfig): Logger {
  if (rootLogger) return rootLogger;

  const options = getDefaultOptions(config.level, config.isDevelopment);
  rootLogger = pino(options);
  return rootLogger;
}

/**
 * Returns the root logger. Throws if `initLogger` hasn't been called yet.
 */
export function getLogger(): Logger {
  if (!rootLogger) {
    throw new Error('Logger not initialized. Call initLogger() first.');
  }
  return rootLogger;
}

/**
 * Creates a child logger bound to a specific service/module name.
 * Adds `{ service }` to every log line for easy filtering.
 *
 * @example
 * const log = createServiceLogger('catalog');
 * log.info('Listing created'); // { service: "catalog", msg: "Listing created" }
 */
export function createServiceLogger(service: string): Logger {
  return getLogger().child({ service });
}

/**
 * Creates a child logger bound to a specific request ID.
 * Used inside Fastify hooks to correlate logs to a single request.
 *
 * @example
 * const log = createRequestLogger('abc-123', 'catalog');
 * log.info('Processing request'); // { requestId: "abc-123", service: "catalog", msg: "..." }
 */
export function createRequestLogger(requestId: string, service?: string): Logger {
  const bindings: Record<string, string> = { requestId };
  if (service) bindings.service = service;
  return getLogger().child(bindings);
}

/**
 * Resets the logger singleton. Only for testing — never call in production.
 * @internal
 */
export function resetLogger(): void {
  rootLogger = null;
}
