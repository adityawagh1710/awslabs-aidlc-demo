import type { FastifyInstance } from 'fastify'

import { prisma } from '../repositories/prisma-client'

async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (request, reply) => {
    const timestamp = new Date().toISOString()
    const checks: { database: 'ok' | 'error'; redis: 'ok' | 'error' } = {
      database: 'error',
      redis: 'error',
    }

    await Promise.all([
      Promise.race([
        prisma.$queryRaw`SELECT 1`.then(() => {
          checks.database = 'ok'
        }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('DB timeout')), 2000),
        ),
      ]).catch(() => {
        checks.database = 'error'
      }),

      Promise.race([
        fastify.redis.ping().then(() => {
          checks.redis = 'ok'
        }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 2000),
        ),
      ]).catch(() => {
        checks.redis = 'error'
      }),
    ])

    const healthy = checks.database === 'ok' && checks.redis === 'ok'
    const status = healthy ? 'ok' : 'degraded'

    return reply.status(healthy ? 200 : 503).send({ status, timestamp, checks })
  })
}

export default healthRoutes
