import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { UnauthorizedError } from '../../shared/errors/index.js';
import type { AuthUser } from '../../shared/types/index.js';

/** Supabase JWT claims shape. */
interface SupabaseJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
}

/** Plugin options. */
export interface AuthPluginOptions {
  supabaseUrl: string;
  jwtSecret: string;
}

/**
 * Auth plugin — decorates the server with `authenticate` preHandler.
 * Verifies Supabase JWTs using the project's JWKS endpoint.
 * On success, attaches `request.user` with the decoded user info.
 */
function authPlugin(server: FastifyInstance, opts: AuthPluginOptions): void {
  // Supabase exposes a JWKS endpoint for JWT verification
  const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', opts.supabaseUrl);
  const JWKS = createRemoteJWKSet(jwksUrl);

  /**
   * Extracts the Bearer token from the Authorization header.
   */
  function extractToken(request: FastifyRequest): string {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }
    return authHeader.slice(7);
  }

  /**
   * Verifies a JWT and returns the decoded payload.
   */
  async function verifyToken(token: string): Promise<SupabaseJwtPayload> {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${opts.supabaseUrl}/auth/v1`,
        audience: 'authenticated',
      });
      return payload as SupabaseJwtPayload;
    } catch (err) {
      throw new UnauthorizedError(
        'Invalid or expired token',
        err instanceof Error ? err : undefined,
      );
    }
  }

  // Decorate request with user property
  server.decorateRequest('user', null);

  /**
   * preHandler hook that requires a valid Supabase JWT.
   * Attach to routes/plugins that need authentication:
   *
   * @example
   * server.get('/me', { preHandler: server.authenticate }, handler);
   */
  server.decorate(
    'authenticate',
    async function authenticateHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
      const token = extractToken(request);
      const payload = await verifyToken(token);

      if (!payload.sub) {
        throw new UnauthorizedError('Token missing subject claim');
      }

      const user: AuthUser = {
        id: payload.sub,
        email: payload.email ?? '',
        role: payload.role ?? 'authenticated',
        claims: payload as unknown as Record<string, unknown>,
      };

      request.user = user;
    },
  );

  /**
   * Optional auth — tries to decode the JWT but doesn't fail if absent.
   * Useful for endpoints that behave differently for logged-in vs anonymous users.
   */
  server.decorate(
    'optionalAuth',
    async function optionalAuthHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return;

      try {
        const token = authHeader.slice(7);
        const payload = await verifyToken(token);

        if (payload.sub) {
          request.user = {
            id: payload.sub,
            email: payload.email ?? '',
            role: payload.role ?? 'authenticated',
            claims: payload as unknown as Record<string, unknown>,
          };
        }
      } catch {
        // Silently ignore invalid tokens for optional auth
      }
    },
  );
}

export default fp(authPlugin, {
  name: 'auth',
  fastify: '5.x',
});

// --- Type augmentation for custom decorators ---
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: AuthUser | null;
  }
}
