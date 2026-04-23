import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const { categoryStore, taskCategoryStore, redisMock } = vi.hoisted(() => {
  const categoryStore = new Map<string, Record<string, unknown>>()
  const taskCategoryStore = new Map<string, Set<string>>()
  const redisData = new Map<string, string>()
  const redisMock = {
    status: 'ready',
    exists: vi.fn(async (key: string) => (redisData.has(key) ? 1 : 0)),
    set: vi.fn(async (key: string, value: string) => { redisData.set(key, value); return 'OK' }),
    del: vi.fn(async (key: string) => { redisData.delete(key); return 1 }),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn().mockReturnThis(),
  }
  return { categoryStore, taskCategoryStore, redisMock }
})

vi.mock('ioredis', () => ({
  default: vi.fn(() => redisMock),
  Redis: vi.fn(() => redisMock),
}))

vi.mock('../../src/repositories/prisma-client', () => ({
  prisma: {
    category: {
      findMany: vi.fn(async ({ where }: any) =>
        [...categoryStore.values()].filter((c) => c.userId === where.userId),
      ),
      findUnique: vi.fn(async ({ where }: any) => categoryStore.get(where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) =>
        [...categoryStore.values()].find(
          (c) => c.userId === where.userId &&
            (c.name as string).toLowerCase() === (where.name as string).toLowerCase(),
        ) ?? null,
      ),
      create: vi.fn(async ({ data }: any) => {
        const cat = { ...data, id: `cat-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }
        categoryStore.set(cat.id as string, cat)
        return cat
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const cat = categoryStore.get(where.id)
        if (!cat) throw new Error('Not found')
        const updated = { ...cat, ...data, updatedAt: new Date() }
        categoryStore.set(where.id, updated)
        return updated
      }),
      delete: vi.fn(async ({ where }: any) => { categoryStore.delete(where.id); return {} }),
    },
    taskCategory: {
      deleteMany: vi.fn(async ({ where }: any) => {
        if (where.categoryId) {
          for (const cats of taskCategoryStore.values()) cats.delete(where.categoryId)
        }
        return { count: 0 }
      }),
    },
    task: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0), findUnique: vi.fn().mockResolvedValue(null) },
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

import { buildTestApp } from '../helpers/build-app'
import { sign } from 'jsonwebtoken'

function makeToken(userId: string) {
  return `Bearer ${sign(
    { sub: userId, jti: `jti-${Date.now()}`, type: 'access', iss: 'todo-api', aud: 'todo-client' },
    process.env['JWT_SECRET'] ?? 'test-secret-that-is-long-enough-32ch',
    { expiresIn: '1h' },
  )}`
}

describe('Category Routes — Integration', () => {
  let app: FastifyInstance
  const USER_ID = 'user-cat'
  const AUTH = makeToken(USER_ID)

  beforeAll(async () => {
    process.env['JWT_SECRET'] = 'test-secret-that-is-long-enough-32ch'
    process.env['DATABASE_URL'] = 'postgresql://test'
    process.env['REDIS_URL'] = 'redis://localhost'
    app = await buildTestApp()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { categoryStore.clear(); taskCategoryStore.clear() })

  it('POST /api/v1/categories — creates category and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/categories',
      headers: { authorization: AUTH },
      body: { name: 'Work' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('Work')
  })

  it('POST /api/v1/categories — rejects duplicate name (conflict)', async () => {
    categoryStore.set('cat-1', { id: 'cat-1', userId: USER_ID, name: 'Work', colour: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/categories',
      headers: { authorization: AUTH },
      body: { name: 'Work' },
    })
    expect(res.statusCode).toBe(409)
  })

  it('GET /api/v1/categories — returns only user categories', async () => {
    categoryStore.set('c1', { id: 'c1', userId: USER_ID, name: 'Personal', colour: null, createdAt: new Date(), updatedAt: new Date() })
    categoryStore.set('c2', { id: 'c2', userId: 'other', name: 'Other', colour: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(200)
    const items = res.json() as any[]
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Personal')
  })

  it('PUT /api/v1/categories/:id — updates name', async () => {
    categoryStore.set('c-upd', { id: 'c-upd', userId: USER_ID, name: 'Old', colour: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/categories/c-upd',
      headers: { authorization: AUTH },
      body: { name: 'New' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('New')
  })

  it('DELETE /api/v1/categories/:id — returns 204', async () => {
    categoryStore.set('c-del', { id: 'c-del', userId: USER_ID, name: 'ToDelete', colour: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/categories/c-del',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(204)
  })

  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/categories' })
    expect(res.statusCode).toBe(401)
  })
})
