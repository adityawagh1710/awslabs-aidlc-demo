import type { Redis } from 'ioredis'
import type { preHandlerHookHandler } from 'fastify'

export interface TokenPayload {
  sub: string
  jti: string
  type: 'access' | 'refresh'
  iat: number
  exp: number
  iss: string
  aud: string | string[]
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: TokenPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
    authenticate: preHandlerHookHandler
  }

  interface FastifyRequest {
    user: TokenPayload
  }
}
