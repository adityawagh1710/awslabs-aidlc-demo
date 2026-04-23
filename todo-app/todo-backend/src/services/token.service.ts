import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { UnauthorizedError } from '../domain/errors'
import type { TokenPayload } from '../types/fastify'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessJti: string
  refreshJti: string
}

export class TokenService {
  constructor(private readonly fastify: FastifyInstance) {}

  signPair(userId: string): TokenPair {
    const accessJti = randomUUID()
    const refreshJti = randomUUID()

    const accessToken = this.fastify.jwt.sign(
      { sub: userId, jti: accessJti, type: 'access' as const },
      { expiresIn: '15m' },
    )

    const refreshToken = this.fastify.jwt.sign(
      { sub: userId, jti: refreshJti, type: 'refresh' as const },
      { expiresIn: '7d' },
    )

    return { accessToken, refreshToken, accessJti, refreshJti }
  }

  verify(token: string): TokenPayload {
    try {
      return this.fastify.jwt.verify<TokenPayload>(token)
    } catch {
      throw new UnauthorizedError('Invalid or expired token')
    }
  }

  async blacklistAccess(jti: string, exp: number): Promise<void> {
    const remaining = exp - Math.floor(Date.now() / 1000)
    if (remaining > 0) {
      await this.fastify.redis.set(`blacklist:${jti}`, '1', 'EX', remaining)
    }
  }

  async storeRefresh(jti: string, userId: string): Promise<void> {
    await this.fastify.redis.set(`refresh:${jti}`, userId, 'EX', 604800)
  }

  async revokeRefresh(jti: string): Promise<void> {
    await this.fastify.redis.del(`refresh:${jti}`)
  }

  async isRefreshValid(jti: string): Promise<boolean> {
    return (await this.fastify.redis.exists(`refresh:${jti}`)) === 1
  }
}
