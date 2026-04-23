import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'

import { env } from '../config/env'

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  const client = new Redis(env.REDIS_URL, {
    retryStrategy: (times) => Math.min(times * 100, 3000),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  })

  client.on('error', (err) => {
    fastify.log.error({ err }, 'Redis client error')
  })

  client.on('reconnecting', () => {
    fastify.log.warn('Redis reconnecting...')
  })

  client.on('ready', () => {
    fastify.log.info('Redis connected')
  })

  fastify.decorate('redis', client)

  fastify.addHook('onClose', async () => {
    await client.quit()
    fastify.log.info('Redis connection closed')
  })
}

export default fp(redisPlugin, { name: 'redis' })
