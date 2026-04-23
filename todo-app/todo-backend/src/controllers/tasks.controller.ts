import type { FastifyReply, FastifyRequest } from 'fastify'
import type { TaskService } from '../services/task.service'
import type { TaskFilters, PaginationInput } from '../repositories/task.repository'
import { ValidationError } from '../domain/errors'

// Parse ISO date string to UTC midnight Date (Pattern 33)
function parseIsoDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

// Normalise query param that may be a single string or array of strings
function toStringArray(val: unknown): string[] | undefined {
  if (val === undefined || val === null) return undefined
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean)
  return undefined
}

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  async listTasks(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const q = request.query as {
      search?: string
      status?: 'active' | 'completed' | 'all'
      priority?: string | string[]
      categoryIds?: string | string[]
      dueDateFrom?: string
      dueDateTo?: string
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }

    // Parse date boundaries (Pattern 33)
    const dueDateFrom = q.dueDateFrom ? parseIsoDate(q.dueDateFrom) : undefined
    const dueDateTo = q.dueDateTo ? parseIsoDate(q.dueDateTo) : undefined

    // Cross-field validation: from must be strictly before to
    if (dueDateFrom && dueDateTo && dueDateFrom >= dueDateTo) {
      throw new ValidationError('Validation failed', {
        dueDateFrom: 'dueDateFrom must be before dueDateTo',
      })
    }

    const filters: TaskFilters = {
      search: q.search,
      status: q.status,
      priority: toStringArray(q.priority) as TaskFilters['priority'],
      categoryIds: toStringArray(q.categoryIds),
      dueDateFrom,
      dueDateTo,
    }

    const pagination: PaginationInput = {
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 25,
    }

    const sort = {
      sortBy: q.sortBy as 'dueDate' | 'priority' | 'createdAt' | 'title' | undefined,
      sortOrder: q.sortOrder,
    }

    const result = await this.taskService.listTasks(userId, { filters, pagination, sort })
    reply.send(result)
  }

  async createTask(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const body = request.body as {
      title: string
      description?: string
      priority?: 'Low' | 'Medium' | 'High'
      dueDate?: string
      timezone?: string
      categoryIds?: string[]
    }
    const task = await this.taskService.createTask(userId, body)
    reply.status(201).send(task)
  }

  async getTask(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const { id } = request.params as { id: string }
    const task = await this.taskService.getTask(id, userId)
    reply.send(task)
  }

  async updateTask(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const { id } = request.params as { id: string }
    const body = request.body as {
      title?: string
      description?: string | null
      priority?: 'Low' | 'Medium' | 'High'
      dueDate?: string | null
      timezone?: string
      categoryIds?: string[]
      completed?: boolean
    }
    const task = await this.taskService.updateTask(id, userId, body)
    reply.send(task)
  }

  async deleteTask(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const { id } = request.params as { id: string }
    await this.taskService.deleteTask(id, userId)
    reply.status(204).send()
  }

  async toggleTask(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const { id } = request.params as { id: string }
    const task = await this.taskService.toggleCompletion(id, userId)
    reply.send(task)
  }
}
