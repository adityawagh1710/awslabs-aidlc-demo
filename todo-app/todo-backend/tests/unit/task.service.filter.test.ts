import { describe, it, expect, vi } from 'vitest'

import { TaskService, normalizeSearch } from '../../src/services/task.service'

// ── normalizeSearch unit tests ────────────────────────────────────────────────

describe('normalizeSearch (Pattern 32)', () => {
  it('returns undefined for undefined input', () => {
    expect(normalizeSearch(undefined)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(normalizeSearch('')).toBeUndefined()
  })

  it('returns undefined for whitespace-only string', () => {
    expect(normalizeSearch('   ')).toBeUndefined()
  })

  it('returns trimmed string for valid input', () => {
    expect(normalizeSearch('  buy groceries  ')).toBe('buy groceries')
  })

  it('returns the string as-is when no surrounding spaces', () => {
    expect(normalizeSearch('urgent')).toBe('urgent')
  })
})

// ── TaskService.listTasks pagination math ─────────────────────────────────────

describe('TaskService.listTasks pagination math', () => {
  function makeMocks(total: number) {
    const taskRepo = {
      findAll: vi.fn().mockResolvedValue({ tasks: [], total }),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    const taskCategoryRepo = {
      setCategories: vi.fn(),
      findCategoriesForTask: vi.fn(),
      removeAllForCategory: vi.fn(),
    }
    const categoryValidation = { validateOwnership: vi.fn().mockResolvedValue([]) }
    return { taskRepo, taskCategoryRepo, categoryValidation }
  }

  it('calculates totalPages correctly', async () => {
    const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks(51)
    const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
    const result = await svc.listTasks('user-1', {
      filters: {},
      pagination: { page: 1, pageSize: 25 },
      sort: {},
    })
    expect(result.totalPages).toBe(3) // ceil(51/25) = 3
  })

  it('returns page 1 of 1 when total is 0', async () => {
    const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks(0)
    const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
    const result = await svc.listTasks('user-1', {
      filters: {},
      pagination: { page: 1, pageSize: 25 },
      sort: {},
    })
    expect(result.totalPages).toBe(1)
    expect(result.total).toBe(0)
  })

  it('passes normalized search to repository (empty string → no filter)', async () => {
    const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks(0)
    const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
    await svc.listTasks('user-1', {
      filters: { search: '   ' },
      pagination: { page: 1, pageSize: 25 },
      sort: {},
    })
    const calledFilters = taskRepo.findAll.mock.calls[0][1]
    expect(calledFilters.search).toBeUndefined()
  })
})
