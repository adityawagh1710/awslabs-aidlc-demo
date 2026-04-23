import Fastify from 'fastify'

import { loggerOptions } from './plugins/logger'
import redisPlugin from './plugins/redis'
import securityPlugin from './plugins/security'
import authPlugin from './plugins/auth'
import errorHandlerPlugin from './plugins/error-handler'
import healthRoutes from './routes/health'
import authRoutes from './routes/auth.routes'
import taskRoutes from './routes/tasks.routes'
import categoryRoutes from './routes/categories.routes'

export async function buildApp() {
  const fastify = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  })

  // 1. Security (helmet, cors, rate-limit)
  await fastify.register(securityPlugin)

  // 2. Redis client
  await fastify.register(redisPlugin)

  // 3. Error handler (before routes so it catches route registration errors)
  await fastify.register(errorHandlerPlugin)

  // 4. Auth (JWT + authenticate decorator — depends on redis)
  await fastify.register(authPlugin)

  // 5. Routes
  await fastify.register(healthRoutes)
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' })
  await fastify.register(taskRoutes, { prefix: '/api/v1/tasks' })
  await fastify.register(categoryRoutes, { prefix: '/api/v1/categories' })

  return fastify
}
