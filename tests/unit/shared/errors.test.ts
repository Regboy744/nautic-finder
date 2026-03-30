import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  InternalError,
  isAppError,
} from '../../../src/shared/errors/index.js';

describe('AppError', () => {
  it('creates an error with status code and message', () => {
    const err = new AppError('Something broke', 500);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('Something broke');
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('AppError');
    expect(err.isOperational).toBe(true);
  });

  it('supports optional code, details, and cause', () => {
    const cause = new Error('root cause');
    const err = new AppError('Oops', 400, {
      code: 'TEST_ERROR',
      details: { field: ['required'] },
      cause,
    });

    expect(err.code).toBe('TEST_ERROR');
    expect(err.details).toEqual({ field: ['required'] });
    // Error.cause is available at runtime (ES2022+) even if TS lib doesn't expose it
    expect((err as unknown as { cause: unknown }).cause).toBe(cause);
  });

  it('serializes to JSON correctly', () => {
    const err = new AppError('Bad input', 400, {
      code: 'BAD_INPUT',
      details: { name: ['too short'] },
    });
    const json = err.toJSON();

    expect(json).toEqual({
      statusCode: 400,
      error: 'AppError',
      message: 'Bad input',
      code: 'BAD_INPUT',
      details: { name: ['too short'] },
    });
  });

  it('omits code and details from JSON when not set', () => {
    const err = new AppError('Simple error', 500);
    const json = err.toJSON();

    expect(json).toEqual({
      statusCode: 500,
      error: 'AppError',
      message: 'Simple error',
    });
  });
});

describe('ValidationError', () => {
  it('defaults to 400 with correct code', () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Validation failed');
    expect(err.name).toBe('ValidationError');
    expect(err.isOperational).toBe(true);
  });

  it('accepts custom message and details', () => {
    const err = new ValidationError('Invalid email', { email: ['must be valid'] });
    expect(err.message).toBe('Invalid email');
    expect(err.details).toEqual({ email: ['must be valid'] });
  });
});

describe('UnauthorizedError', () => {
  it('defaults to 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Authentication required');
  });
});

describe('ForbiddenError', () => {
  it('defaults to 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('NotFoundError', () => {
  it('defaults to 404 with resource name', () => {
    const err = new NotFoundError('Listing', 'abc-123');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe("Listing 'abc-123' not found");
  });

  it('works without identifier', () => {
    const err = new NotFoundError('User');
    expect(err.message).toBe('User not found');
  });

  it('uses default resource name', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
  });
});

describe('ConflictError', () => {
  it('defaults to 409', () => {
    const err = new ConflictError('Email already taken');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Email already taken');
  });
});

describe('RateLimitError', () => {
  it('defaults to 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
  });
});

describe('ExternalServiceError', () => {
  it('defaults to 502 with service name', () => {
    const err = new ExternalServiceError('openai');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(err.message).toContain('openai');
  });

  it('accepts custom message', () => {
    const err = new ExternalServiceError('stripe', 'Payment failed');
    expect(err.message).toBe('Payment failed');
  });
});

describe('InternalError', () => {
  it('defaults to 500 and is NOT operational', () => {
    const err = new InternalError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(false);
  });
});

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(new AppError('test', 500))).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
    expect(isAppError(new ValidationError())).toBe(true);
  });

  it('returns false for non-AppError values', () => {
    expect(isAppError(new Error('plain'))).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });
});
