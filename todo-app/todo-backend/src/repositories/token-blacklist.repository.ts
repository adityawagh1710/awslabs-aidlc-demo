import type { Redis } from 'ioredis'

export class TokenBlacklistRepository {
  constructor(private readonly redis: Redis) {}

  async add(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds)
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.exists(`blacklist:${jti}`)
    return result === 1
  }
}
