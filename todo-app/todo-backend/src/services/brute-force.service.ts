import type { Redis } from 'ioredis'

const LOCKOUT_TTL = 900
const ATTEMPTS_TTL = 900
const LOCKOUT_THRESHOLD = 5

export class BruteForceService {
  constructor(private readonly redis: Redis) {}

  async isLocked(email: string): Promise<boolean> {
    return (await this.redis.exists(`lockout:${email}`)) === 1
  }

  async recordFailure(email: string): Promise<void> {
    const count = await this.redis.incr(`attempts:${email}`)
    if (count === 1) {
      await this.redis.expire(`attempts:${email}`, ATTEMPTS_TTL)
    }
    if (count >= LOCKOUT_THRESHOLD) {
      await this.redis.set(`lockout:${email}`, '1', 'EX', LOCKOUT_TTL)
      await this.redis.del(`attempts:${email}`)
    }
  }

  async reset(email: string): Promise<void> {
    await this.redis.del(`attempts:${email}`)
  }
}
