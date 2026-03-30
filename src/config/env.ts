import { z } from 'zod';

/**
 * Zod schema for validating all environment variables.
 * Grouped by concern for clarity. Fails fast on startup if invalid.
 */
const envSchema = z.object({
  // -- App --
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3001'),

  // -- Database --
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // -- Redis --
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),

  // -- AI Services --
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),

  // -- Scraping --
  PROXY_URL: z.string().optional().default(''),
  SCRAPER_USER_AGENT: z.string().default('NauticFinder/1.0'),

  // -- Notifications --
  RESEND_API_KEY: z.string().optional().default(''),
  WEB_PUSH_VAPID_PUBLIC_KEY: z.string().optional().default(''),
  WEB_PUSH_VAPID_PRIVATE_KEY: z.string().optional().default(''),

  // -- Auth --
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

/** Parsed and validated environment variables type */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Structured configuration object with grouped access.
 * Example: `config.database.url` instead of `process.env.DATABASE_URL`.
 */
export interface AppConfig {
  app: {
    nodeEnv: string;
    port: number;
    logLevel: string;
    corsOrigin: string;
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
  };
  database: {
    url: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;
  };
  redis: {
    url: string;
  };
  ai: {
    geminiApiKey: string;
    anthropicApiKey: string;
    openaiApiKey: string;
  };
  scraping: {
    proxyUrl: string;
    userAgent: string;
  };
  notification: {
    resendApiKey: string;
    vapidPublicKey: string;
    vapidPrivateKey: string;
  };
  auth: {
    jwtSecret: string;
  };
}

/**
 * Parses and validates environment variables, returning a structured config object.
 * Throws a descriptive error if any required variable is missing or invalid.
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  const e = result.data;

  return {
    app: {
      nodeEnv: e.NODE_ENV,
      port: e.PORT,
      logLevel: e.LOG_LEVEL,
      corsOrigin: e.CORS_ORIGIN,
      isProduction: e.NODE_ENV === 'production',
      isDevelopment: e.NODE_ENV === 'development',
      isTest: e.NODE_ENV === 'test',
    },
    database: {
      url: e.DATABASE_URL,
      supabaseUrl: e.SUPABASE_URL,
      supabaseAnonKey: e.SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: e.SUPABASE_SERVICE_ROLE_KEY,
    },
    redis: {
      url: e.REDIS_URL,
    },
    ai: {
      geminiApiKey: e.GEMINI_API_KEY,
      anthropicApiKey: e.ANTHROPIC_API_KEY,
      openaiApiKey: e.OPENAI_API_KEY,
    },
    scraping: {
      proxyUrl: e.PROXY_URL,
      userAgent: e.SCRAPER_USER_AGENT,
    },
    notification: {
      resendApiKey: e.RESEND_API_KEY,
      vapidPublicKey: e.WEB_PUSH_VAPID_PUBLIC_KEY,
      vapidPrivateKey: e.WEB_PUSH_VAPID_PRIVATE_KEY,
    },
    auth: {
      jwtSecret: e.JWT_SECRET,
    },
  };
}
