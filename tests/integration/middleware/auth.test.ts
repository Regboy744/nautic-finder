import { describe, it, expect, afterEach } from 'vitest';
import { createRawTestServer } from '../../helpers/test-server.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

let server: FastifyInstance;

afterEach(async () => {
  if (server) await server.close();
});

describe('Auth Middleware', () => {
  it('rejects requests without Authorization header', async () => {
    server = await createRawTestServer();

    server.get(
      '/protected',
      { preHandler: server.authenticate },
      async (request: FastifyRequest, _reply: FastifyReply) => {
        return { user: request.user };
      },
    );

    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/protected',
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects requests with malformed Authorization header', async () => {
    server = await createRawTestServer();

    server.get(
      '/protected',
      { preHandler: server.authenticate },
      async (request: FastifyRequest, _reply: FastifyReply) => {
        return { user: request.user };
      },
    );

    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Basic abc123' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('rejects requests with invalid JWT', async () => {
    server = await createRawTestServer();

    server.get(
      '/protected',
      { preHandler: server.authenticate },
      async (request: FastifyRequest, _reply: FastifyReply) => {
        return { user: request.user };
      },
    );

    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer invalid-token-here' },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('allows unauthenticated access with optionalAuth when no header', async () => {
    server = await createRawTestServer();

    server.get(
      '/optional',
      { preHandler: server.optionalAuth },
      async (request: FastifyRequest, _reply: FastifyReply) => {
        return { user: request.user, isLoggedIn: request.user !== null };
      },
    );

    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/optional',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user).toBeNull();
    expect(body.isLoggedIn).toBe(false);
  });

  it('ignores invalid tokens with optionalAuth (does not fail)', async () => {
    server = await createRawTestServer();

    server.get(
      '/optional',
      { preHandler: server.optionalAuth },
      async (request: FastifyRequest, _reply: FastifyReply) => {
        return { user: request.user, isLoggedIn: request.user !== null };
      },
    );

    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/optional',
      headers: { authorization: 'Bearer bad-token' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user).toBeNull();
  });
});
