import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

import { buildTestApp } from '../helpers/build-app'

// Mock Prisma and Redis for integration tests that don't need real services
vi.mock('../../src/repositories/prisma-client', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('ioredis', () => {
  const mockRedis = {
    status: 'ready',
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    exists: vi.fn().mockResolvedValue(0),
    set: vi.fn().mockResolvedValue('OK'),
    connect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnThis(),
  }
  return { default: vi.fn(() => mockRedis), Redis: vi.fn(() => mockRedis) }
})

describe('GET /health', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns 200 with status ok when all checks pass', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.status).toBe('ok')
    expect(body.checks.database).toBe('ok')
    expect(body.checks.redis).toBe('ok')
    expect(body.timestamp).toBeDefined()
  })
})
