import type { FastifyReply, FastifyRequest } from 'fastify'

import type { CategoryService } from '../services/category.service'

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  async listCategories(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const categories = await this.categoryService.listCategories(userId)
    reply.send(categories)
  }

  async createCategory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const { name } = request.body as { name: string }
    const category = await this.categoryService.createCategory(userId, { name })
    reply.status(201).send(category)
  }

  async updateCategory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const { id } = request.params as { id: string }
    const { name } = request.body as { name: string }
    const category = await this.categoryService.updateCategory(id, userId, { name })
    reply.send(category)
  }

  async deleteCategory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user.sub
    const { id } = request.params as { id: string }
    await this.categoryService.deleteCategory(id, userId)
    reply.status(204).send()
  }
}
