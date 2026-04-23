import './config/env' // Validate env vars first — exits on failure

import Redis from 'ioredis'

import { buildApp } from './app'
import { prisma } from './repositories/prisma-client'
import { env } from './config/env'

async function start(): Promise<void> {
  // Connectivity checks before accepting traffic
  await verifyDatabase()
  await verifyRedis()

  const fastify = await buildApp()

  const shutdown = async (signal: string): Promise<void> => {
    fastify.log.info(`Received ${signal} — shutting down gracefully`)

    const hardKill = setTimeout(() => {
      fastify.log.error('Graceful shutdown timed out — forcing exit')
      process.exit(1)
    }, 10_000)
    hardKill.unref()

    try {
      await fastify.close()
      await prisma.$disconnect()
      fastify.log.info('Shutdown complete')
      process.exit(0)
    } catch (err) {
      fastify.log.error({ err }, 'Error during shutdown')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error({ err }, 'Failed to start server')
    process.exit(1)
  }
}

async function verifyDatabase(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`
    process.stdout.write('✓ PostgreSQL connected\n')
  } catch (err) {
    console.error('✗ PostgreSQL connection failed:', err)
    process.exit(1)
  }
}

async function verifyRedis(): Promise<void> {
  const client = new Redis(env.REDIS_URL, { lazyConnect: true, enableReadyCheck: true })
  try {
    await client.connect()
    await client.ping()
    process.stdout.write('✓ Redis connected\n')
  } catch (err) {
    console.error('✗ Redis connection failed:', err)
    process.exit(1)
  } finally {
    await client.quit()
  }
}

start()
