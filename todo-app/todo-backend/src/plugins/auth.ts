import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { env } from '../config/env'
import { ServiceUnavailableError, UnauthorizedError } from '../domain/errors'
import type { TokenPayload } from '../types/fastify'

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(import('@fastify/jwt'), {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
    verify: {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
  })

  const authenticate = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    let payload: TokenPayload

    try {
      payload = await request.jwtVerify<TokenPayload>()
    } catch {
      throw new UnauthorizedError('Invalid or expired token')
    }

    if (fastify.redis.status !== 'ready') {
      throw new ServiceUnavailableError('Authentication service temporarily unavailable')
    }

    const isBlacklisted = await fastify.redis.exists(`blacklist:${payload.jti}`)
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked')
    }

    request.user = payload
  }

  fastify.decorate('authenticate', authenticate)
}

export default fp(authPlugin, { name: 'auth', dependencies: ['redis'] })
