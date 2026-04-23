import type { FastifyInstance } from 'fastify'

import { CategoryController } from '../controllers/categories.controller'
import { CategoryService } from '../services/category.service'
import { CategoryRepository } from '../repositories/category.repository'
import { TaskCategoryRepository } from '../repositories/task-category.repository'

const categoryDTOSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
}

async function categoryRoutes(fastify: FastifyInstance): Promise<void> {
  const categoryRepo = new CategoryRepository()
  const taskCategoryRepo = new TaskCategoryRepository()
  const categoryService = new CategoryService(categoryRepo, taskCategoryRepo)
  const controller = new CategoryController(categoryService)

  fastify.get(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        response: { 200: { type: 'array', items: categoryDTOSchema } },
      },
    },
    controller.listCategories.bind(controller),
  )

  fastify.post(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
          },
        },
        response: { 201: categoryDTOSchema },
      },
    },
    controller.createCategory.bind(controller),
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
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
          },
        },
        response: { 200: categoryDTOSchema },
      },
    },
    controller.updateCategory.bind(controller),
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
    controller.deleteCategory.bind(controller),
  )
}

export default categoryRoutes
