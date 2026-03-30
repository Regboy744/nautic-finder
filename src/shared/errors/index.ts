/**
 * Custom error classes for consistent error handling across the application.
 * All errors extend AppError to provide structured error responses.
 */

/** Standard error response shape returned to clients. */
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  /** Machine-readable error code for client-side handling. */
  code?: string;
  /** Field-level validation details. */
  details?: Record<string, string[]>;
}

/**
 * Base application error. All custom errors extend this.
 * Provides HTTP status code, error name, optional machine code, and details.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: Record<string, string[]>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    options?: {
      code?: string;
      details?: Record<string, string[]>;
      /** Operational errors are expected (bad input, auth failure). Non-operational = bugs. */
      isOperational?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;

    // Maintain proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  /** Converts to the standard JSON error response. */
  toJSON(): ErrorResponse {
    return {
      statusCode: this.statusCode,
      error: this.name,
      message: this.message,
      ...(this.code && { code: this.code }),
      ...(this.details && { details: this.details }),
    };
  }
}

/** 400 — Invalid request data (e.g., missing fields, wrong types). */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, string[]>, cause?: unknown) {
    super(message, 400, { code: 'VALIDATION_ERROR', details, cause });
  }
}

/** 401 — Missing or invalid authentication credentials. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', cause?: unknown) {
    super(message, 401, { code: 'UNAUTHORIZED', cause });
  }
}

/** 403 — Authenticated but lacks permission. */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', cause?: unknown) {
    super(message, 403, { code: 'FORBIDDEN', cause });
  }
}

/** 404 — Requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier?: string) {
    const msg = identifier ? `${resource} '${identifier}' not found` : `${resource} not found`;
    super(msg, 404, { code: 'NOT_FOUND' });
  }
}

/** 409 — Resource conflict (e.g., duplicate email, already exists). */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', cause?: unknown) {
    super(message, 409, { code: 'CONFLICT', cause });
  }
}

/** 429 — Too many requests. */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, { code: 'RATE_LIMITED' });
  }
}

/** 502 — External service (AI, scraper, payment, etc.) failed. */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, cause?: unknown) {
    super(message ?? `External service '${service}' failed`, 502, {
      code: 'EXTERNAL_SERVICE_ERROR',
      cause,
    });
  }
}

/** 500 — Unexpected internal error. Not operational (indicates a bug). */
export class InternalError extends AppError {
  constructor(message = 'Internal server error', cause?: unknown) {
    super(message, 500, { code: 'INTERNAL_ERROR', isOperational: false, cause });
  }
}

/**
 * Type guard: checks if an unknown error is an AppError instance.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
