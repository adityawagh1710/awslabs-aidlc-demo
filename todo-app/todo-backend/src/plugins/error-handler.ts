import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyError } from 'fastify'

import { AppError, ValidationError } from '../domain/errors'
import { env } from '../config/env'

async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((error: FastifyError | AppError | Error, request, reply) => {
    if (error instanceof ValidationError) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      })
    }

    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        request.log.error({ err: error }, error.message)
      } else {
        request.log.warn({ err: error }, error.message)
      }
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
      })
    }

    // Fastify validation errors (AJV)
    if ('validation' in error && error.validation) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: error.message,
      })
    }

    // 429 from rate-limit plugin
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'TooManyRequests',
        message: error.message,
      })
    }

    request.log.error(
      { err: error },
      'Unhandled error',
    )

    return reply.status(500).send({
      error: 'InternalServerError',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
    })
  })
}

export default fp(errorHandlerPlugin, { name: 'error-handler' })
