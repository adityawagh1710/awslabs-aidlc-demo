import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { sign } from 'jsonwebtoken'

import { buildTestApp } from '../helpers/build-app'

// ── Hoisted in-memory stores ──────────────────────────────────────────────────
const { taskStore, categoryStore, taskCategoryStore, redisMock, userStore } = vi.hoisted(() => {
  const taskStore = new Map<string, Record<string, unknown>>()
  const categoryStore = new Map<string, Record<string, unknown>>()
  const taskCategoryStore = new Map<string, Set<string>>() // taskId → Set<categoryId>
  const userStore = new Map<string, Record<string, unknown>>()
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
  return { taskStore, categoryStore, taskCategoryStore, redisMock, userStore }
})

vi.mock('ioredis', () => ({
  default: vi.fn(() => redisMock),
  Redis: vi.fn(() => redisMock),
}))

vi.mock('../../src/repositories/prisma-client', () => ({
  prisma: {
    task: {
      findMany: vi.fn(async ({ where }: any) => {
        return [...taskStore.values()]
          .filter((t) => t.userId === where.userId)
          .map((t) => ({ ...t, categories: [] }))
      }),
      count: vi.fn(async ({ where }: any) => {
        return [...taskStore.values()].filter((t) => t.userId === where.userId).length
      }),
      findUnique: vi.fn(async ({ where, include }: any) => {
        const task = taskStore.get(where.id)
        if (!task || !include) return task ?? null
        const catIds = taskCategoryStore.get(where.id as string) ?? new Set()
        const categories = [...catIds].map((catId) => ({
          category: categoryStore.get(catId),
        }))
        return task ? { ...task, categories } : null
      }),
      create: vi.fn(async ({ data }: any) => {
        const task = { ...data, id: `task-${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), categories: [] }
        taskStore.set(task.id as string, task)
        return task
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const task = taskStore.get(where.id)
        if (!task) throw new Error('Task not found')
        const updated = { ...task, ...data, updatedAt: new Date() }
        taskStore.set(where.id, updated)
        return { ...updated, categories: [] }
      }),
      delete: vi.fn(async ({ where }: any) => { taskStore.delete(where.id); return {} }),
    },
    category: {
      findMany: vi.fn(async ({ where }: any) => {
        return [...categoryStore.values()].filter((c) => c.userId === where.userId)
      }),
      findUnique: vi.fn(async ({ where }: any) => categoryStore.get(where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) => {
        return [...categoryStore.values()].find(
          (c) => c.userId === where.userId && (c.name as string).toLowerCase() === (where.name as string).toLowerCase(),
        ) ?? null
      }),
      create: vi.fn(async ({ data }: any) => {
        const cat = { ...data, id: `cat-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }
        categoryStore.set(cat.id as string, cat)
        return cat
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const cat = categoryStore.get(where.id)
        if (!cat) throw new Error('Category not found')
        const updated = { ...cat, ...data, updatedAt: new Date() }
        categoryStore.set(where.id, updated)
        return updated
      }),
      delete: vi.fn(async ({ where }: any) => { categoryStore.delete(where.id); return {} }),
    },
    taskCategory: {
      deleteMany: vi.fn(async ({ where }: any) => {
        if (where.taskId) taskCategoryStore.set(where.taskId, new Set())
        if (where.categoryId) {
          for (const [, cats] of taskCategoryStore) {
            cats.delete(where.categoryId)
          }
        }
        return { count: 0 }
      }),
      createMany: vi.fn(async ({ data }: any) => {
        for (const row of data) {
          if (!taskCategoryStore.has(row.taskId)) taskCategoryStore.set(row.taskId, new Set())
          taskCategoryStore.get(row.taskId)!.add(row.categoryId)
        }
        return { count: data.length }
      }),
      findMany: vi.fn(async ({ where, include }: any) => {
        const catIds = taskCategoryStore.get(where.taskId) ?? new Set()
        return [...catIds].map((catId) => ({
          taskId: where.taskId,
          categoryId: catId,
          category: include ? categoryStore.get(catId) : undefined,
        }))
      }),
    },
    user: {
      findUnique: vi.fn(async ({ where }: any) => userStore.get(where.id ?? where.email) ?? null),
    },
    $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

function makeToken(userId: string) {
  return `Bearer ${sign(
    { sub: userId, jti: `jti-${Date.now()}`, type: 'access', iss: 'todo-api', aud: 'todo-client' },
    process.env['JWT_SECRET'] ?? 'test-secret-that-is-long-enough-32ch',
    { expiresIn: '1h' },
  )}`
}

describe('Task Routes — Integration', () => {
  let app: FastifyInstance
  const USER_ID = 'user-abc'
  const AUTH = makeToken(USER_ID)

  beforeAll(async () => {
    process.env['DATABASE_URL'] = process.env['DATABASE_URL'] ?? 'postgresql://test'
    process.env['REDIS_URL'] = process.env['REDIS_URL'] ?? 'redis://localhost'
    app = await buildTestApp()
  })

  afterAll(async () => { await app.close() })

  beforeEach(() => {
    taskStore.clear()
    categoryStore.clear()
    taskCategoryStore.clear()
  })

  it('POST /api/v1/tasks — creates task and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: AUTH },
      body: { title: 'Buy groceries', priority: 'High' },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.title).toBe('Buy groceries')
    expect(body.priority).toBe('High')
    expect(body.completed).toBe(false)
    expect(body.isOverdue).toBe(false)
  })

  it('POST /api/v1/tasks — rejects missing title with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: AUTH },
      body: { priority: 'Low' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/v1/tasks — returns only requesting user tasks', async () => {
    taskStore.set('t1', { id: 't1', userId: USER_ID, title: 'Mine', status: 'ACTIVE', priority: 'MEDIUM', dueDate: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() })
    taskStore.set('t2', { id: 't2', userId: 'other-user', title: 'Theirs', status: 'ACTIVE', priority: 'MEDIUM', dueDate: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items).toHaveLength(1)
    expect(body.items[0].title).toBe('Mine')
  })

  it('GET /api/v1/tasks/:id — returns 404 for missing task', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/nonexistent',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(404)
  })

  it('GET /api/v1/tasks/:id — returns 403 for another user task', async () => {
    taskStore.set('t-other', { id: 't-other', userId: 'other', title: 'Other', status: 'ACTIVE', priority: 'MEDIUM', dueDate: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/t-other',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(403)
  })

  it('PATCH /api/v1/tasks/:id/toggle — toggles completion', async () => {
    taskStore.set('t-toggle', { id: 't-toggle', userId: USER_ID, title: 'Toggle me', status: 'ACTIVE', priority: 'MEDIUM', dueDate: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/t-toggle/toggle',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().completed).toBe(true)
  })

  it('DELETE /api/v1/tasks/:id — returns 204', async () => {
    taskStore.set('t-del', { id: 't-del', userId: USER_ID, title: 'Delete me', status: 'ACTIVE', priority: 'MEDIUM', dueDate: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() })
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/t-del',
      headers: { authorization: AUTH },
    })
    expect(res.statusCode).toBe(204)
  })

  it('requires authentication — returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks' })
    expect(res.statusCode).toBe(401)
  })
})
