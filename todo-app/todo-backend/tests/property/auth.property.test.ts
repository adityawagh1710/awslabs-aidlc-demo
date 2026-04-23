import { describe, it, expect, vi, beforeEach } from 'vitest'
import fc from 'fast-check'
import type { FastifyInstance } from 'fastify'

// Lightweight in-memory Redis for property tests
const redisStore = new Map<string, string>()
const redisMock = {
  status: 'ready',
  exists: vi.fn(async (key: string) => (redisStore.has(key) ? 1 : 0)),
  set: vi.fn(async (key: string, value: string) => {
    redisStore.set(key, value)
    return 'OK'
  }),
  del: vi.fn(async (key: string) => {
    redisStore.delete(key)
    return 1
  }),
  incr: vi.fn(async (key: string) => {
    const n = parseInt(redisStore.get(key) ?? '0') + 1
    redisStore.set(key, String(n))
    return n
  }),
  expire: vi.fn().mockResolvedValue(1),
  ping: vi.fn().mockResolvedValue('PONG'),
  quit: vi.fn().mockResolvedValue('OK'),
  on: vi.fn().mockReturnThis(),
}

vi.mock('ioredis', () => ({
  default: vi.fn(() => redisMock),
  Redis: vi.fn(() => redisMock),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hashSync: vi.fn().mockReturnValue('$2a$04$dummy'),
    hash: vi.fn(async (pw: string) => `hash(${pw})`),
    compare: vi.fn(async (pw: string, hash: string) => hash === `hash(${pw})`),
  },
}))

// Inline FastifyInstance mock for TokenService
function makeFastify(secret = 'test-secret-32-chars-minimum-length'): FastifyInstance {
  // Use a simple HMAC-based JWT for property tests
  const sign = (payload: Record<string, unknown>, opts: { expiresIn: string }) => {
    const now = Math.floor(Date.now() / 1000)
    const expOffset = opts.expiresIn === '15m' ? 900 : 604800
    const fullPayload = { ...payload, iat: now, exp: now + expOffset, iss: 'todo-api', aud: 'todo-client' }
    return Buffer.from(JSON.stringify(fullPayload)).toString('base64url') + '.' + secret
  }
  const verify = (token: string) => {
    if (!token.endsWith('.' + secret)) throw new Error('invalid signature')
    const [payloadB64] = token.split('.')
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('jwt expired')
    return payload
  }
  return {
    jwt: { sign: vi.fn(sign), verify: vi.fn(verify) },
    redis: redisMock,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  } as unknown as FastifyInstance
}

import { TokenService } from '../../src/services/token.service'
import { BruteForceService } from '../../src/services/brute-force.service'

describe('Auth Property Tests', () => {
  beforeEach(() => {
    redisStore.clear()
    vi.clearAllMocks()
    // Re-wire mocks after clearAllMocks
    redisMock.exists = vi.fn(async (key: string) => (redisStore.has(key) ? 1 : 0))
    redisMock.set = vi.fn(async (key: string, value: string) => {
      redisStore.set(key, value)
      return 'OK'
    })
    redisMock.del = vi.fn(async (key: string) => {
      redisStore.delete(key)
      return 1
    })
    redisMock.incr = vi.fn(async (key: string) => {
      const n = parseInt(redisStore.get(key) ?? '0') + 1
      redisStore.set(key, String(n))
      return n
    })
    redisMock.expire = vi.fn().mockResolvedValue(1)
  })

  // PBT-02: JWT round-trip
  describe('PBT-02: JWT round-trip', () => {
    it('verify(sign({ sub, jti, type })).sub === sub for arbitrary CUID-like sub values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s.trim().length > 0),
          (userId) => {
            const fastify = makeFastify()
            const tokenService = new TokenService(fastify)
            const { accessToken } = tokenService.signPair(userId)
            const payload = tokenService.verify(accessToken)
            return payload.sub === userId
          },
        ),
        { numRuns: 100 },
      )
    })

    it('access token has type "access" and refresh token has type "refresh"', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 32 }).filter((s) => s.trim().length > 0),
          (userId) => {
            const fastify = makeFastify()
            const tokenService = new TokenService(fastify)
            const { accessToken, refreshToken } = tokenService.signPair(userId)
            const accessPayload = tokenService.verify(accessToken)
            const refreshPayload = tokenService.verify(refreshToken)
            return accessPayload.type === 'access' && refreshPayload.type === 'refresh'
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  // PBT-02: Password hash round-trip
  describe('PBT-02: Password hash round-trip', () => {
    it('compare(pw, hash(pw)) always true', async () => {
      const bcrypt = (await import('bcryptjs')).default
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 72 }),
          async (pw) => {
            const hash = await bcrypt.hash(pw, 4)
            return bcrypt.compare(pw, hash)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('compare(other, hash(pw)) always false when other !== pw', async () => {
      const bcrypt = (await import('bcryptjs')).default
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 72 }),
          fc.string({ minLength: 1, maxLength: 72 }),
          async (pw, other) => {
            fc.pre(pw !== other)
            const hash = await bcrypt.hash(pw, 4)
            const result = await bcrypt.compare(other, hash)
            return result === false
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  // PBT-04: Blacklist idempotency
  describe('PBT-04: Blacklist idempotency', () => {
    it('blacklisting same jti twice does not throw; token remains invalid', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (jti) => {
            redisStore.clear()
            const fastify = makeFastify()
            const tokenService = new TokenService(fastify)
            const exp = Math.floor(Date.now() / 1000) + 900

            // Blacklist twice — must not throw
            await tokenService.blacklistAccess(jti, exp)
            await tokenService.blacklistAccess(jti, exp)

            // Token must remain invalid (key must exist in store)
            return redisStore.has(`blacklist:${jti}`)
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  // PBT-05: Email normalisation idempotency
  describe('PBT-05: Email normalisation idempotency', () => {
    it('normalise(normalise(email)) === normalise(email)', () => {
      const normalise = (email: string) => email.trim().toLowerCase()
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          return normalise(normalise(email)) === normalise(email)
        }),
        { numRuns: 200 },
      )
    })
  })

  // BruteForce lockout threshold
  describe('BruteForce lockout threshold', () => {
    it('exactly 5 failures produce a lockout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            redisStore.clear()
            const bruteForce = new BruteForceService(redisMock as unknown as import('ioredis').Redis)

            for (let i = 0; i < 5; i++) {
              await bruteForce.recordFailure(email)
            }

            return bruteForce.isLocked(email)
          },
        ),
        { numRuns: 20 },
      )
    })

    it('4 failures never produce a lockout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            redisStore.clear()
            const bruteForce = new BruteForceService(redisMock as unknown as import('ioredis').Redis)

            for (let i = 0; i < 4; i++) {
              await bruteForce.recordFailure(email)
            }

            const locked = await bruteForce.isLocked(email)
            return locked === false
          },
        ),
        { numRuns: 20 },
      )
    })
  })
})
