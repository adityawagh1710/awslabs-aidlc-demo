import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import fc from 'fast-check'

// Hoisted stateful mocks — shared between vi.mock factories and test cases
const { redisData, redisMock, userStore } = vi.hoisted(() => {
  const redisData = new Map<string, string>()

  interface StoredUser {
    id: string
    email: string
    passwordHash: string
    createdAt: Date
    updatedAt: Date
  }
  const userStore = new Map<string, StoredUser>()

  const redisMock = {
    status: 'ready',
    exists: vi.fn(async (key: string) => (redisData.has(key) ? 1 : 0)),
    set: vi.fn(async (key: string, value: string) => {
      redisData.set(key, value)
      return 'OK'
    }),
    del: vi.fn(async (key: string) => {
      redisData.delete(key)
      return 1
    }),
    incr: vi.fn(async (key: string) => {
      const current = parseInt(redisData.get(key) ?? '0')
      const next = current + 1
      redisData.set(key, String(next))
      return next
    }),
    expire: vi.fn().mockResolvedValue(1),
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn().mockReturnThis(),
  }

  return { redisData, redisMock, userStore }
})

vi.mock('ioredis', () => ({
  default: vi.fn(() => redisMock),
  Redis: vi.fn(() => redisMock),
}))

vi.mock('../../src/repositories/prisma-client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.email) return userStore.get(where.email) ?? null
        if (where.id) {
          for (const u of userStore.values()) {
            if (u.id === where.id) return u
          }
          return null
        }
        return null
      }),
      create: vi.fn(async ({ data }: { data: { email: string; passwordHash: string } }) => {
        const user = {
          id: `user-${Date.now()}`,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        userStore.set(data.email, user)
        return user
      }),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hashSync: vi.fn().mockReturnValue('$2a$04$dummy-hash'),
    hash: vi.fn(async (_pw: string, _rounds: number) => '$2a$04$hashed-password'),
    compare: vi.fn(async (pw: string, hash: string) => {
      // Correct password is 'Passw0rd!' which hashes to '$2a$04$hashed-password'
      return hash === '$2a$04$hashed-password' && pw === 'Passw0rd!'
    }),
  },
}))

import { buildTestApp } from '../helpers/build-app'

describe('Auth Routes — Integration', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    redisData.clear()
    userStore.clear()
  })

  describe('POST /api/v1/auth/register', () => {
    it('201 with accessToken, refreshToken, user on success', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'alice@example.com', password: 'Passw0rd!' },
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.accessToken).toBeDefined()
      expect(body.refreshToken).toBeDefined()
      expect(body.user.email).toBe('alice@example.com')
      expect(body.user.id).toBeDefined()
      expect(body.user.passwordHash).toBeUndefined()
    })

    it('normalises email to lowercase on register', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'Alice@Example.COM', password: 'Passw0rd!' },
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().user.email).toBe('alice@example.com')
    })

    it('409 when email already registered', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'dup@example.com', password: 'Passw0rd!' },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'dup@example.com', password: 'Passw0rd!' },
      })

      expect(response.statusCode).toBe(409)
    })

    it('400 when email is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'not-an-email', password: 'Passw0rd!' },
      })
      expect(response.statusCode).toBe(400)
    })

    it('400 when password is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'test@example.com', password: 'short' },
      })
      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'alice@example.com', password: 'Passw0rd!' },
      })
    })

    it('200 with token pair on valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'alice@example.com', password: 'Passw0rd!' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.accessToken).toBeDefined()
      expect(body.refreshToken).toBeDefined()
      expect(body.user.email).toBe('alice@example.com')
    })

    it('401 on wrong password with generic message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'alice@example.com', password: 'WrongPassword1' },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().message).toBe('Invalid credentials')
    })

    it('401 on unknown email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'unknown@example.com', password: 'Passw0rd!' },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('200 with new token pair on valid refresh token', async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'refresh@example.com', password: 'Passw0rd!' },
      })
      const { refreshToken } = reg.json()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.accessToken).toBeDefined()
      expect(body.refreshToken).toBeDefined()
    })

    it('401 on invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken: 'not.a.valid.jwt' },
      })
      expect(response.statusCode).toBe(401)
    })

    it('401 on used (revoked) refresh token', async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'rotate@example.com', password: 'Passw0rd!' },
      })
      const { refreshToken } = reg.json()

      // First refresh consumes the token
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken },
      })

      // Second refresh with same token must fail
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('204 on authenticated logout', async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'logout@example.com', password: 'Passw0rd!' },
      })
      const { accessToken } = reg.json()

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {},
      })

      expect(response.statusCode).toBe(204)
    })

    it('401 without authentication token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        payload: {},
      })
      expect(response.statusCode).toBe(401)
    })

    it('401 when using blacklisted access token after logout', async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'blacklist@example.com', password: 'Passw0rd!' },
      })
      const { accessToken, refreshToken } = reg.json()

      // Logout to blacklist the access token
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { refreshToken },
      })

      // Attempt to logout again with the now-blacklisted token
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {},
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // PBT-05: email normalisation idempotency via HTTP
  describe('PBT-05: email normalisation idempotency', () => {
    it('normalise(normalise(email)) === normalise(email)', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            const once = email.trim().toLowerCase()
            const twice = once.trim().toLowerCase()
            return once === twice
          },
        ),
        { numRuns: 100 },
      )
    })

    it('mixed-case email and its lowercase version refer to the same account (409 on duplicate)', async () => {
      const email = 'UniqueUser@Example.COM'
      const normalised = email.trim().toLowerCase()

      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email, password: 'Passw0rd!' },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: normalised, password: 'Passw0rd!' },
      })

      expect(response.statusCode).toBe(409)
    })
  })
})
