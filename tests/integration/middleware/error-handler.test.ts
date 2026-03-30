import { describe, it, expect, afterEach } from 'vitest';
import { createTestServer, createRawTestServer } from '../../helpers/test-server.js';
import { NotFoundError, ValidationError } from '../../../src/shared/errors/index.js';
import type { FastifyInstance } from 'fastify';

let server: FastifyInstance;

afterEach(async () => {
  if (server) await server.close();
});

describe('Error Handler Middleware', () => {
  it('returns 404 for undefined routes', async () => {
    server = await createTestServer();

    const response = await server.inject({
      method: 'GET',
      url: '/nonexistent-route',
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('returns consistent error format for AppError subclasses', async () => {
    server = await createRawTestServer();

    // Register a test route that throws NotFoundError
    server.get('/test-not-found', () => {
      throw new NotFoundError('Boat', 'abc-123');
    });

    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/test-not-found',
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.statusCode).toBe(404);
    expect(body.error.error).toBe('NotFoundError');
    expect(body.error.message).toBe("Boat 'abc-123' not found");
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns validation error details', async () => {
    server = await createRawTestServer();

    server.post('/test-validation', () => {
      throw new ValidationError('Invalid input', {
        email: ['must be a valid email'],
        name: ['is required', 'must be at least 2 characters'],
      });
    });

    await server.ready();

    const response = await server.inject({
      method: 'POST',
      url: '/test-validation',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error.details).toEqual({
      email: ['must be a valid email'],
      name: ['is required', 'must be at least 2 characters'],
    });
  });

  it('returns 500 for unexpected errors', async () => {
    server = await createRawTestServer();

    server.get('/test-crash', () => {
      throw new Error('Something unexpected broke');
    });

    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/test-crash',
    });

    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('includes X-Request-ID header in responses', async () => {
    server = await createTestServer();

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers['x-request-id']).toBeDefined();
    expect(typeof response.headers['x-request-id']).toBe('string');
  });
});
