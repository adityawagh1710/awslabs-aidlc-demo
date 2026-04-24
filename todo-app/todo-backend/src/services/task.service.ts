import type { Priority } from '@prisma/client'

import { ForbiddenError, NotFoundError, ValidationError } from '../domain/errors'
import type { TaskFilters, PaginationInput, TaskRepository, TaskSortInput, TaskWithCategories } from '../repositories/task.repository'
import type { TaskCategoryRepository } from '../repositories/task-category.repository'
import { sanitizeText, sanitizeTextOrNull } from '../utils/sanitize'
import { computeIsOverdue, isPastDate, isValidTimezone } from '../utils/date'

import type { CategoryValidationService } from './category-validation.service'

export interface TaskDTO {
  id: string
  title: string
  description: string | null
  priority: 'Low' | 'Medium' | 'High'
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  isOverdue: boolean
  categories: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>
  createdAt: string
  updatedAt: string
}

export interface PaginatedTasksDTO {
  items: TaskDTO[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: 'Low' | 'Medium' | 'High'
  dueDate?: string
  timezone?: string
  categoryIds?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  priority?: 'Low' | 'Medium' | 'High'
  dueDate?: string | null
  timezone?: string
  categoryIds?: string[]
  completed?: boolean
}

export interface TaskListInput {
  filters: TaskFilters
  pagination: PaginationInput
  sort: TaskSortInput
}

// Trim and return undefined for empty/whitespace search (Pattern 32)
export function normalizeSearch(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const PRIORITY_MAP: Record<string, Priority> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
}

const PRIORITY_REVERSE: Record<Priority, 'Low' | 'Medium' | 'High'> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

function toTaskDTO(task: TaskWithCategories, now: Date): TaskDTO {
  const isCompleted = task.status === 'COMPLETED'
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    priority: PRIORITY_REVERSE[task.priority],
    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
    completed: isCompleted,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    isOverdue: computeIsOverdue(task.dueDate, isCompleted, now),
    categories: task.categories.map((tc) => ({
      id: tc.category.id,
      name: tc.category.name,
      createdAt: tc.category.createdAt.toISOString(),
      updatedAt: tc.category.updatedAt.toISOString(),
    })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

function validateDueDate(dueDate: string, timezone: string | undefined): void {
  if (!timezone) {
    throw new ValidationError('Validation failed', {
      timezone: 'timezone is required when dueDate is provided',
    })
  }
  if (!isValidTimezone(timezone)) {
    throw new ValidationError('Validation failed', {
      timezone: 'timezone must be a valid IANA timezone identifier',
    })
  }
  if (isPastDate(dueDate, timezone)) {
    throw new ValidationError('Validation failed', {
      dueDate: 'Due date must be today or in the future',
    })
  }
}

export class TaskService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly taskCategoryRepo: TaskCategoryRepository,
    private readonly categoryValidation: CategoryValidationService,
  ) {}

  async listTasks(userId: string, input: TaskListInput): Promise<PaginatedTasksDTO> {
    const normalizedFilters: TaskFilters = {
      ...input.filters,
      search: normalizeSearch(input.filters.search),
    }
    const { tasks, total } = await this.taskRepo.findAll(
      userId,
      normalizedFilters,
      input.pagination,
      input.sort,
    )
    const now = new Date()
    const items = tasks.map((t) => toTaskDTO(t, now))
    const { page, pageSize } = input.pagination
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  }

  async getTask(taskId: string, userId: string): Promise<TaskDTO> {
    const task = await this.taskRepo.findById(taskId)
    if (!task) throw new NotFoundError('Task')
    if (task.userId !== userId) throw new ForbiddenError()
    return toTaskDTO(task, new Date())
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<TaskDTO> {
    const title = sanitizeText(input.title)
    const description = sanitizeTextOrNull(input.description)
    const priority: Priority = PRIORITY_MAP[input.priority ?? 'Medium']
    const categoryIds = input.categoryIds ?? []

    if (categoryIds.length > 10) {
      throw new ValidationError('Validation failed', {
        categoryIds: 'A task can have at most 10 categories',
      })
    }

    let dueDateObj: Date | undefined
    if (input.dueDate) {
      validateDueDate(input.dueDate, input.timezone)
      dueDateObj = new Date(input.dueDate)
    }

    if (categoryIds.length > 0) {
      const invalid = await this.categoryValidation.validateOwnership(categoryIds, userId)
      if (invalid.length > 0) {
        throw new ValidationError('Validation failed', {
          categoryIds: invalid.map((id) => `${id} is not a valid category`),
        })
      }
    }

    const task = await this.taskRepo.create({
      userId,
      title,
      description,
      priority,
      dueDate: dueDateObj ?? null,
    })

    if (categoryIds.length > 0) {
      await this.taskCategoryRepo.setCategories(task.id, categoryIds)
    }

    const fresh = await this.taskRepo.findById(task.id)
    return toTaskDTO(fresh!, new Date())
  }

  async updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<TaskDTO> {
    const task = await this.taskRepo.findById(taskId)
    if (!task) throw new NotFoundError('Task')
    if (task.userId !== userId) throw new ForbiddenError()

    const updateData: Parameters<TaskRepository['update']>[1] = {}

    if (input.title !== undefined) updateData.title = sanitizeText(input.title)
    if (input.description !== undefined) updateData.description = sanitizeTextOrNull(input.description)
    if (input.priority !== undefined) updateData.priority = PRIORITY_MAP[input.priority]

    if (input.dueDate !== undefined) {
      if (input.dueDate === null) {
        updateData.dueDate = null
      } else {
        validateDueDate(input.dueDate, input.timezone)
        updateData.dueDate = new Date(input.dueDate)
      }
    }

    if (input.completed !== undefined) {
      const becomingComplete = input.completed && task.status !== 'COMPLETED'
      updateData.status = input.completed ? 'COMPLETED' : 'ACTIVE'
      if (becomingComplete && task.completedAt === null) {
        updateData.completedAt = new Date()
      }
    }

    const categoryIds = input.categoryIds
    if (categoryIds !== undefined) {
      if (categoryIds.length > 10) {
        throw new ValidationError('Validation failed', {
          categoryIds: 'A task can have at most 10 categories',
        })
      }
      if (categoryIds.length > 0) {
        const invalid = await this.categoryValidation.validateOwnership(categoryIds, userId)
        if (invalid.length > 0) {
          throw new ValidationError('Validation failed', {
            categoryIds: invalid.map((id) => `${id} is not a valid category`),
          })
        }
      }
      await this.taskCategoryRepo.setCategories(taskId, categoryIds)
    }

    if (Object.keys(updateData).length > 0) {
      await this.taskRepo.update(taskId, updateData)
    }

    const fresh = await this.taskRepo.findById(taskId)
    return toTaskDTO(fresh!, new Date())
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId)
    if (!task) throw new NotFoundError('Task')
    if (task.userId !== userId) throw new ForbiddenError()
    await this.taskRepo.delete(taskId)
  }

  async toggleCompletion(taskId: string, userId: string): Promise<TaskDTO> {
    const task = await this.taskRepo.findById(taskId)
    if (!task) throw new NotFoundError('Task')
    if (task.userId !== userId) throw new ForbiddenError()

    const becomingComplete = task.status !== 'COMPLETED'
    const updateData: Parameters<TaskRepository['update']>[1] = {
      status: becomingComplete ? 'COMPLETED' : 'ACTIVE',
    }

    // Write-once: only set completedAt on first completion
    if (becomingComplete && task.completedAt === null) {
      updateData.completedAt = new Date()
    }

    const updated = await this.taskRepo.update(taskId, updateData)
    return toTaskDTO(updated, new Date())
  }

  async getSuggestions(userId: string, query: string): Promise<string[]> {
    const q = query.trim()
    if (q.length < 1) return []
    return this.taskRepo.getSuggestions(userId, q)
  }
}
