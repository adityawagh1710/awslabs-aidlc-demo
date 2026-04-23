import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { sign } from 'jsonwebtoken'

// ── In-memory stores ──────────────────────────────────────────────────────────
const { taskStore, categoryStore, taskCategoryStore, redisMock } = vi.hoisted(() => {
  const taskStore = new Map<string, Record<string, unknown>>()
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
  return { taskStore, categoryStore, taskCategoryStore, redisMock }
})

vi.mock('ioredis', () => ({
  default: vi.fn(() => redisMock),
  Redis: vi.fn(() => redisMock),
}))

vi.mock('../../src/repositories/prisma-client', () => ({
  prisma: {
    task: {
      findMany: vi.fn(async ({ where, take, skip }: any) => {
        let items = [...taskStore.values()].filter((t) => t.userId === where.userId)
        if (where.status) items = items.filter((t) => t.status === where.status)
        if (where.priority?.in) items = items.filter((t) => where.priority.in.includes(t.priority))
        const start = skip ?? 0
        return items.slice(start, start + (take ?? 1000)).map((t) => ({ ...t, categories: [] }))
      }),
      count: vi.fn(async ({ where }: any) => {
        let items = [...taskStore.values()].filter((t) => t.userId === where.userId)
        if (where.status) items = items.filter((t) => t.status === where.status)
        if (where.priority?.in) items = items.filter((t) => where.priority.in.includes(t.priority))
        return items.length
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const task = taskStore.get(where.id)
        if (!task) return null
        return { ...task, categories: [] }
      }),
      create: vi.fn(async ({ data }: any) => {
        const task = { ...data, id: `task-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }
        taskStore.set(task.id, task)
        return { ...task, categories: [] }
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const task = taskStore.get(where.id)
        if (!task) throw new Error('Not found')
        const updated = { ...task, ...data, updatedAt: new Date() }
        taskStore.set(where.id, updated)
        return { ...updated, categories: [] }
      }),
      delete: vi.fn(async ({ where }: any) => { taskStore.delete(where.id); return {} }),
    },
    category: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    taskCategory: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

import { buildTestApp } from '../helpers/build-app'

const JWT_SECRET = 'test-secret-that-is-long-enough-32ch'

function makeToken(userId: string) {
  return `Bearer ${sign(
    { sub: userId, jti: `jti-${Date.now()}`, type: 'access', iss: 'todo-api', aud: 'todo-client' },
    JWT_SECRET,
    { expiresIn: '1h' },
  )}`
}

function makeTask(id: string, userId: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    userId,
    title: `Task ${id}`,
    description: null,
    status: 'ACTIVE',
    priority: 'MEDIUM',
    dueDate: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('Task Filter Endpoints — Integration', () => {
  let app: FastifyInstance
  const USER_ID = 'user-filter'
  const AUTH = makeToken(USER_ID)

  beforeAll(async () => {
    process.env['JWT_SECRET'] = JWT_SECRET
    process.env['DATABASE_URL'] = 'postgresql://test'
    process.env['REDIS_URL'] = 'redis://localhost'
    app = await buildTestApp()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { taskStore.clear() })

  it('GET /api/v1/tasks returns paginated response shape', async () => {
    taskStore.set('t1', makeTask('t1', USER_ID))
    const res = await app.inject({
      method: 'GET', url: '/api/v1/tasks',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('page')
    expect(body).toHaveProperty('pageSize')
    expect(body).toHaveProperty('totalPages')
  })

  it('GET /api/v1/tasks?status=active returns only active tasks', async () => {
    taskStore.set('t-active', makeTask('t-active', USER_ID, { status: 'ACTIVE' }))
    taskStore.set('t-done', makeTask('t-done', USER_ID, { status: 'COMPLETED' }))
    const res = await app.inject({
      method: 'GET', url: '/api/v1/tasks?status=active',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items.every((t: any) => t.completed === false)).toBe(true)
  })

  it('GET /api/v1/tasks?pageSize=2 returns at most 2 items', async () => {
    for (let i = 0; i < 5; i++) taskStore.set(`t${i}`, makeTask(`t${i}`, USER_ID))
    const res = await app.inject({
      method: 'GET', url: '/api/v1/tasks?pageSize=2',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().items.length).toBeLessThanOrEqual(2)
  })

  it('GET /api/v1/tasks?pageSize=51 returns 400 (exceeds max 50)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/tasks?pageSize=51',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/v1/tasks?dueDateFrom=2030-01-01&dueDateTo=2029-01-01 returns 400 (from >= to)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/tasks?dueDateFrom=2030-01-01&dueDateTo=2029-01-01',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/v1/tasks?status=invalid returns 400', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/tasks?status=invalid',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(400)
  })

  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?search=test' })
    expect(res.statusCode).toBe(401)
  })
})
