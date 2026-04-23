import { describe, it, expect, vi } from 'vitest'

import { TaskService } from '../../src/services/task.service'
import { ForbiddenError, NotFoundError, ValidationError } from '../../src/domain/errors'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: null,
    status: 'ACTIVE' as const,
    priority: 'MEDIUM' as const,
    dueDate: null,
    completedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    categories: [],
    ...overrides,
  }
}

function makeMocks() {
  const taskRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  const taskCategoryRepo = {
    setCategories: vi.fn().mockResolvedValue(undefined),
    findCategoriesForTask: vi.fn().mockResolvedValue([]),
    removeAllForCategory: vi.fn().mockResolvedValue(undefined),
  }
  const categoryValidation = {
    validateOwnership: vi.fn().mockResolvedValue([]),
  }
  return { taskRepo, taskCategoryRepo, categoryValidation }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TaskService', () => {
  describe('getTask', () => {
    it('throws NotFoundError when task does not exist', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      taskRepo.findById.mockResolvedValue(null)
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await expect(svc.getTask('task-1', 'user-1')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when task belongs to another user', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      taskRepo.findById.mockResolvedValue(makeTask({ userId: 'other-user' }))
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await expect(svc.getTask('task-1', 'user-1')).rejects.toThrow(ForbiddenError)
    })

    it('returns task DTO with isOverdue=false for completed task past due date', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      const past = new Date('2020-01-01')
      taskRepo.findById.mockResolvedValue(makeTask({ status: 'COMPLETED', dueDate: past }))
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      const result = await svc.getTask('task-1', 'user-1')
      expect(result.isOverdue).toBe(false)
      expect(result.completed).toBe(true)
    })

    it('returns task DTO with isOverdue=true for active task with past due date', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      const past = new Date('2020-01-01')
      taskRepo.findById.mockResolvedValue(makeTask({ status: 'ACTIVE', dueDate: past }))
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      const result = await svc.getTask('task-1', 'user-1')
      expect(result.isOverdue).toBe(true)
    })
  })

  describe('createTask', () => {
    it('rejects more than 10 categoryIds', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      const ids = Array.from({ length: 11 }, (_, i) => `cat-${i}`)
      await expect(
        svc.createTask('user-1', { title: 'Task', categoryIds: ids }),
      ).rejects.toThrow(ValidationError)
    })

    it('rejects invalid category IDs with 400 field error', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      categoryValidation.validateOwnership.mockResolvedValue(['bad-id'])
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await expect(
        svc.createTask('user-1', { title: 'Task', categoryIds: ['bad-id'] }),
      ).rejects.toThrow(ValidationError)
    })

    it('sanitizes HTML in title before persisting', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      const created = makeTask({ title: '&lt;script&gt;' })
      taskRepo.create.mockResolvedValue(created)
      taskRepo.findById.mockResolvedValue(created)
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await svc.createTask('user-1', { title: '<script>' })
      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: '&#x3C;script&#x3E;' }),
      )
    })
  })

  describe('toggleCompletion', () => {
    it('sets completedAt on first completion (write-once)', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      const task = makeTask({ status: 'ACTIVE', completedAt: null })
      const updated = makeTask({ status: 'COMPLETED', completedAt: new Date() })
      taskRepo.findById.mockResolvedValue(task)
      taskRepo.update.mockResolvedValue(updated)
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await svc.toggleCompletion('task-1', 'user-1')
      const updateCall = taskRepo.update.mock.calls[0][1]
      expect(updateCall.completedAt).toBeInstanceOf(Date)
    })

    it('does NOT update completedAt on re-completion (write-once, Q3:A)', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      const originalDate = new Date('2026-01-15')
      // Task was previously completed then reopened — has completedAt but status ACTIVE
      const task = makeTask({ status: 'ACTIVE', completedAt: originalDate })
      const updated = makeTask({ status: 'COMPLETED', completedAt: originalDate })
      taskRepo.findById.mockResolvedValue(task)
      taskRepo.update.mockResolvedValue(updated)
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await svc.toggleCompletion('task-1', 'user-1')
      const updateCall = taskRepo.update.mock.calls[0][1]
      // completedAt should NOT be in the update data — it already has a value
      expect(updateCall.completedAt).toBeUndefined()
    })

    it('does NOT clear completedAt when reopening (write-once)', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      const completedTask = makeTask({ status: 'COMPLETED', completedAt: new Date('2026-01-10') })
      taskRepo.findById.mockResolvedValue(completedTask)
      taskRepo.update.mockResolvedValue(makeTask({ status: 'ACTIVE', completedAt: new Date('2026-01-10') }))
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await svc.toggleCompletion('task-1', 'user-1')
      const updateCall = taskRepo.update.mock.calls[0][1]
      expect(updateCall.completedAt).toBeUndefined()
      expect(updateCall.status).toBe('ACTIVE')
    })

    it('throws ForbiddenError for wrong user', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      taskRepo.findById.mockResolvedValue(makeTask({ userId: 'other' }))
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await expect(svc.toggleCompletion('task-1', 'user-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('deleteTask', () => {
    it('throws NotFoundError for missing task', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      taskRepo.findById.mockResolvedValue(null)
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await expect(svc.deleteTask('task-1', 'user-1')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError for wrong user', async () => {
      const { taskRepo, taskCategoryRepo, categoryValidation } = makeMocks()
      taskRepo.findById.mockResolvedValue(makeTask({ userId: 'other' }))
      const svc = new TaskService(taskRepo as any, taskCategoryRepo as any, categoryValidation as any)
      await expect(svc.deleteTask('task-1', 'user-1')).rejects.toThrow(ForbiddenError)
    })
  })
})
