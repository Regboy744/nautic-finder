import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { isAppError } from '../../shared/errors/index.js';
import type { ApiErrorResponse } from '../../shared/types/index.js';

/**
 * Builds a consistent error response body.
 */
function buildErrorResponse(
  statusCode: number,
  errorName: string,
  message: string,
  code?: string,
  details?: Record<string, string[]>,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      statusCode,
      error: errorName,
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };
}

/**
 * Converts a ZodError into a field-level details map.
 */
function zodErrorToDetails(zodError: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join('.') || '_root';
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }
  return details;
}

/**
 * Global error handler plugin.
 * Catches all errors and returns a consistent JSON error response.
 *
 * Handles:
 * - AppError subclasses (our custom errors)
 * - ZodError (validation failures)
 * - Fastify errors (rate limit 429, not found 404, etc.)
 * - Unknown errors (500 Internal Server Error)
 */
function errorHandlerPlugin(server: FastifyInstance): void {
  server.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      // --- Our custom AppError hierarchy ---
      if (isAppError(error)) {
        // Log operational errors at warn, bugs at error
        if (error.isOperational) {
          request.log.warn({ err: error, statusCode: error.statusCode }, error.message);
        } else {
          request.log.error({ err: error, statusCode: error.statusCode }, error.message);
        }

        const body = buildErrorResponse(
          error.statusCode,
          error.name,
          error.message,
          error.code,
          error.details,
        );

        return reply.status(error.statusCode).send(body);
      }

      // --- Zod validation errors ---
      if (error instanceof ZodError) {
        const details = zodErrorToDetails(error);
        const body = buildErrorResponse(
          400,
          'ValidationError',
          'Validation failed',
          'VALIDATION_ERROR',
          details,
        );
        request.log.warn({ err: error }, 'Zod validation failed');
        return reply.status(400).send(body);
      }

      // --- Fastify errors (have statusCode) ---
      const maybeStatusCode =
        'statusCode' in error ? (error as { statusCode: unknown }).statusCode : undefined;
      if (typeof maybeStatusCode === 'number') {
        const fastifyError = error as FastifyError;
        const statusCode = maybeStatusCode;

        // Don't log 404s as errors (noisy)
        if (statusCode === 404) {
          request.log.debug({ url: request.url }, 'Route not found');
        } else if (statusCode >= 500) {
          request.log.error({ err: error }, error.message);
        } else {
          request.log.warn({ err: error, statusCode }, error.message);
        }

        const body = buildErrorResponse(
          statusCode,
          fastifyError.code ?? 'FastifyError',
          fastifyError.message,
          fastifyError.code,
        );

        return reply.status(statusCode).send(body);
      }

      // --- Unknown / unexpected errors ---
      request.log.error({ err: error }, 'Unhandled error');

      const body = buildErrorResponse(
        500,
        'InternalError',
        'Internal server error',
        'INTERNAL_ERROR',
      );

      return reply.status(500).send(body);
    },
  );

  // --- Handle 404 for undefined routes ---
  server.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const body = buildErrorResponse(
      404,
      'NotFoundError',
      `Route ${request.method} ${request.url} not found`,
      'ROUTE_NOT_FOUND',
    );
    return reply.status(404).send(body);
  });
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
  fastify: '5.x',
});
