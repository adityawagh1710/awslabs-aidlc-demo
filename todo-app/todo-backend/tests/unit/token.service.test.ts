import { describe, it, expect, vi, beforeEach } from 'vitest'
import fc from 'fast-check'
import type { FastifyInstance } from 'fastify'

import { TokenService } from '../../src/services/token.service'
import { UnauthorizedError } from '../../src/domain/errors'

function makeVerifiedPayload(overrides: Record<string, unknown> = {}) {
  return {
    sub: 'user-1',
    jti: 'jti-1',
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
    iss: 'todo-api',
    aud: 'todo-client',
    ...overrides,
  }
}

function makeFastify(overrides: Record<string, unknown> = {}): FastifyInstance {
  return {
    jwt: {
      sign: vi.fn().mockReturnValue('signed-token'),
      verify: vi.fn().mockReturnValue(makeVerifiedPayload()),
      ...((overrides.jwt as object | undefined) ?? {}),
    },
    redis: {
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      exists: vi.fn().mockResolvedValue(1),
      ...((overrides.redis as object | undefined) ?? {}),
    },
  } as unknown as FastifyInstance
}

describe('TokenService', () => {
  let fastify: FastifyInstance
  let service: TokenService

  beforeEach(() => {
    fastify = makeFastify()
    service = new TokenService(fastify)
  })

  describe('signPair', () => {
    it('calls jwt.sign twice with correct type claims', () => {
      const result = service.signPair('user-123')

      expect(fastify.jwt.sign).toHaveBeenCalledTimes(2)

      const [accessArgs] = (fastify.jwt.sign as ReturnType<typeof vi.fn>).mock.calls[0] as [
        Record<string, unknown>,
        Record<string, unknown>,
      ]
      const [refreshArgs] = (fastify.jwt.sign as ReturnType<typeof vi.fn>).mock.calls[1] as [
        Record<string, unknown>,
        Record<string, unknown>,
      ]

      expect(accessArgs.type).toBe('access')
      expect(accessArgs.sub).toBe('user-123')
      expect(refreshArgs.type).toBe('refresh')
      expect(refreshArgs.sub).toBe('user-123')

      expect(result.accessToken).toBe('signed-token')
      expect(result.refreshToken).toBe('signed-token')
      expect(result.accessJti).toBeDefined()
      expect(result.refreshJti).toBeDefined()
      expect(result.accessJti).not.toBe(result.refreshJti)
    })

    it('produces unique JTIs on successive calls', () => {
      const a = service.signPair('user-1')
      const b = service.signPair('user-1')
      expect(a.accessJti).not.toBe(b.accessJti)
      expect(a.refreshJti).not.toBe(b.refreshJti)
    })
  })

  describe('verify', () => {
    it('returns payload for valid token', () => {
      const payload = service.verify('valid-token')
      expect(payload.sub).toBe('user-1')
      expect(fastify.jwt.verify).toHaveBeenCalledWith('valid-token')
    })

    it('throws UnauthorizedError for invalid token', () => {
      ;(fastify.jwt.verify as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('jwt malformed')
      })
      expect(() => service.verify('bad-token')).toThrow(UnauthorizedError)
    })

    it('throws UnauthorizedError for expired token', () => {
      ;(fastify.jwt.verify as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('jwt expired')
      })
      expect(() => service.verify('expired-token')).toThrow(UnauthorizedError)
    })
  })

  describe('blacklistAccess', () => {
    it('sets Redis key with remaining TTL', async () => {
      const exp = Math.floor(Date.now() / 1000) + 900
      await service.blacklistAccess('jti-abc', exp)
      expect(fastify.redis.set).toHaveBeenCalledWith(
        'blacklist:jti-abc',
        '1',
        'EX',
        expect.any(Number),
      )
    })

    it('skips set when token is already expired', async () => {
      const exp = Math.floor(Date.now() / 1000) - 10
      await service.blacklistAccess('jti-old', exp)
      expect(fastify.redis.set).not.toHaveBeenCalled()
    })
  })

  describe('storeRefresh', () => {
    it('stores refresh token with 7-day TTL', async () => {
      await service.storeRefresh('jti-r1', 'user-1')
      expect(fastify.redis.set).toHaveBeenCalledWith('refresh:jti-r1', 'user-1', 'EX', 604800)
    })
  })

  describe('revokeRefresh', () => {
    it('deletes refresh token key', async () => {
      await service.revokeRefresh('jti-r1')
      expect(fastify.redis.del).toHaveBeenCalledWith('refresh:jti-r1')
    })
  })

  describe('isRefreshValid', () => {
    it('returns true when key exists', async () => {
      ;(fastify.redis.exists as ReturnType<typeof vi.fn>).mockResolvedValue(1)
      expect(await service.isRefreshValid('jti-r1')).toBe(true)
    })

    it('returns false when key does not exist', async () => {
      ;(fastify.redis.exists as ReturnType<typeof vi.fn>).mockResolvedValue(0)
      expect(await service.isRefreshValid('jti-r1')).toBe(false)
    })
  })

  // PBT-02: round-trip property
  describe('PBT-02: verify(sign(payload)).sub === payload.sub', () => {
    it('holds for arbitrary userId strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s.trim().length > 0),
          (userId) => {
            const capturedPayload = makeVerifiedPayload({ sub: userId })
            ;(fastify.jwt.sign as ReturnType<typeof vi.fn>).mockReturnValue('token-for-' + userId)
            ;(fastify.jwt.verify as ReturnType<typeof vi.fn>).mockReturnValue(capturedPayload)

            const { accessToken } = service.signPair(userId)
            const result = service.verify(accessToken)
            return result.sub === userId
          },
        ),
      )
    })
  })
})
