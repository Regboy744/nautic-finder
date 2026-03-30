import { describe, it, expect, afterAll } from 'vitest';
import { createTestServer } from '../helpers/test-server.js';
import type { FastifyInstance } from 'fastify';

describe('GET /health', () => {
  let server: FastifyInstance;

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it('returns 200 with status ok', async () => {
    server = await createTestServer();

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe('number');
  });

  it('returns valid ISO timestamp', async () => {
    server = await createTestServer();

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    const body: { timestamp: string } = response.json();
    const date = new Date(body.timestamp);
    expect(date.toISOString()).toBe(body.timestamp);
  });
});
