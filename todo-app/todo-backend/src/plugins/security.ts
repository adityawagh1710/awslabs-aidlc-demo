import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'

import { env } from '../config/env'

async function securityPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000 } : false,
  })

  await fastify.register(import('@fastify/cors'), {
    origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : '*',
    credentials: env.NODE_ENV === 'production',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  await fastify.register(import('@fastify/rate-limit'), {
    max: env.NODE_ENV === 'production' ? 200 : 10000,
    timeWindow: '15 minutes',
    errorResponseBuilder: () => ({
      error: 'TooManyRequests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  })
}

export default fp(securityPlugin, { name: 'security' })
