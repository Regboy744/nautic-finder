import type { z } from 'zod';
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { ValidationError } from '../../shared/errors/index.js';

/**
 * Options for the Zod validation preHandler factory.
 * Provide schemas for any combination of body, querystring, and params.
 */
export interface ValidateSchemas {
  body?: z.ZodType;
  querystring?: z.ZodType;
  params?: z.ZodType;
}

/**
 * Creates a Fastify preHandler hook that validates request data against Zod schemas.
 * On success, replaces the request property with the parsed (and typed) result.
 * On failure, throws a ValidationError with field-level details.
 *
 * @example
 * server.post('/items', {
 *   preHandler: validate({ body: createItemSchema }),
 *   handler: async (request, reply) => { ... }
 * });
 */
export function validate(schemas: ValidateSchemas) {
  return function validateHandler(
    request: FastifyRequest,
    _reply: FastifyReply,
    done: HookHandlerDoneFunction,
  ): void {
    const allDetails: Record<string, string[]> = {};
    let hasErrors = false;

    if (schemas.body) {
      const result = schemas.body.safeParse(request.body);
      if (result.success) {
        (request as FastifyRequest & { body: unknown }).body = result.data;
      } else {
        hasErrors = true;
        for (const issue of result.error.issues) {
          const path = `body.${issue.path.join('.')}` || 'body';
          if (!allDetails[path]) allDetails[path] = [];
          allDetails[path].push(issue.message);
        }
      }
    }

    if (schemas.querystring) {
      const result = schemas.querystring.safeParse(request.query);
      if (result.success) {
        (request as FastifyRequest & { query: unknown }).query = result.data;
      } else {
        hasErrors = true;
        for (const issue of result.error.issues) {
          const path = `query.${issue.path.join('.')}` || 'query';
          if (!allDetails[path]) allDetails[path] = [];
          allDetails[path].push(issue.message);
        }
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(request.params);
      if (result.success) {
        (request as FastifyRequest & { params: unknown }).params = result.data;
      } else {
        hasErrors = true;
        for (const issue of result.error.issues) {
          const path = `params.${issue.path.join('.')}` || 'params';
          if (!allDetails[path]) allDetails[path] = [];
          allDetails[path].push(issue.message);
        }
      }
    }

    if (hasErrors) {
      done(new ValidationError('Request validation failed', allDetails));
    } else {
      done();
    }
  };
}
