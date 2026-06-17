import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError, ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ error: "Validation failed", details: err.flatten() });
      }
      throw err;
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      (request as FastifyRequest & { validatedQuery: T }).validatedQuery = schema.parse(request.query);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ error: "Validation failed", details: err.flatten() });
      }
      throw err;
    }
  };
}
