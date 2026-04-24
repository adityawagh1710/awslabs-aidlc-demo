import type { FastifyInstance } from 'fastify'

import { TaskController } from '../controllers/tasks.controller'
import { TaskService } from '../services/task.service'
import { CategoryValidationService } from '../services/category-validation.service'
import { TaskRepository } from '../repositories/task.repository'
import { TaskCategoryRepository } from '../repositories/task-category.repository'
import { CategoryRepository } from '../repositories/category.repository'

const PRIORITY_ENUM = ['Low', 'Medium', 'High'] as const
const SORT_BY_ENUM = ['dueDate', 'priority', 'createdAt', 'title'] as const
const SORT_ORDER_ENUM = ['asc', 'desc'] as const

const taskDTOSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    priority: { type: 'string', enum: PRIORITY_ENUM },
    dueDate: { type: ['string', 'null'] },
    completed: { type: 'boolean' },
    completedAt: { type: ['string', 'null'] },
    isOverdue: { type: 'boolean' },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
}

async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  const taskRepo = new TaskRepository()
  const taskCategoryRepo = new TaskCategoryRepository()
  const categoryRepo = new CategoryRepository()
  const categoryValidation = new CategoryValidationService(categoryRepo)
  const taskService = new TaskService(taskRepo, taskCategoryRepo, categoryValidation)
  const controller = new TaskController(taskService)

  fastify.get(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            // Sort (existing)
            sortBy: { type: 'string', enum: SORT_BY_ENUM },
            sortOrder: { type: 'string', enum: SORT_ORDER_ENUM },
            // Search (UNIT-06)
            search: { type: 'string', maxLength: 500 },
            // Filters (UNIT-06)
            status: { type: 'string', enum: ['active', 'completed', 'all'] },
            priority: {
              oneOf: [
                { type: 'string', enum: ['Low', 'Medium', 'High'] },
                { type: 'array', items: { type: 'string', enum: ['Low', 'Medium', 'High'] } },
              ],
            },
            categoryIds: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            dueDateFrom: { type: 'string' },
            dueDateTo: { type: 'string' },
            // Pagination (UNIT-06)
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 25 },
          },
        },
      },
    },
    controller.listTasks.bind(controller),
  )

  fastify.post(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', maxLength: 2000 },
            priority: { type: 'string', enum: PRIORITY_ENUM },
            dueDate: { type: 'string' },
            timezone: { type: 'string' },
            categoryIds: { type: 'array', items: { type: 'string' }, maxItems: 10 },
          },
        },
        response: { 201: taskDTOSchema },
      },
    },
    controller.createTask.bind(controller),
  )

  fastify.get(
    '/suggestions',
    {
      preHandler: fastify.authenticate,
      schema: {
        querystring: {
          type: 'object',
          properties: { q: { type: 'string', maxLength: 200 } },
        },
        response: { 200: { type: 'array', items: { type: 'string' } } },
      },
    },
    controller.getSuggestions.bind(controller),
  )

  fastify.get(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: { 200: taskDTOSchema },
      },
    },
    controller.getTask.bind(controller),
  )

  fastify.put(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: ['string', 'null'], maxLength: 2000 },
            priority: { type: 'string', enum: PRIORITY_ENUM },
            dueDate: { type: ['string', 'null'] },
            timezone: { type: 'string' },
            categoryIds: { type: 'array', items: { type: 'string' }, maxItems: 10 },
            completed: { type: 'boolean' },
          },
        },
        response: { 200: taskDTOSchema },
      },
    },
    controller.updateTask.bind(controller),
  )

  fastify.delete(
    '/:id',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: { 204: { type: 'null' } },
      },
    },
    controller.deleteTask.bind(controller),
  )

  fastify.patch(
    '/:id/toggle',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: { 200: taskDTOSchema },
      },
    },
    controller.toggleTask.bind(controller),
  )
}

export default taskRoutes
