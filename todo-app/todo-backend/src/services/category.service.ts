import type { Category } from '@prisma/client'

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/errors'
import type { CategoryRepository } from '../repositories/category.repository'
import type { TaskCategoryRepository } from '../repositories/task-category.repository'
import { sanitizeText } from '../utils/sanitize'

export interface CategoryDTO {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

function toCategoryDTO(cat: Category): CategoryDTO {
  return {
    id: cat.id,
    name: cat.name,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }
}

export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepository,
    private readonly taskCategoryRepo: TaskCategoryRepository,
  ) {}

  async listCategories(userId: string): Promise<CategoryDTO[]> {
    const categories = await this.categoryRepo.findAllByUser(userId)
    return categories.map(toCategoryDTO)
  }

  async createCategory(userId: string, input: { name: string }): Promise<CategoryDTO> {
    const name = sanitizeText(input.name)
    const existing = await this.categoryRepo.findByNameAndUser(name, userId)
    if (existing) {
      throw new ConflictError('You already have a category with this name')
    }
    const category = await this.categoryRepo.create({ userId, name })
    return toCategoryDTO(category)
  }

  async updateCategory(
    categoryId: string,
    userId: string,
    input: { name: string },
  ): Promise<CategoryDTO> {
    const category = await this.categoryRepo.findById(categoryId)
    if (!category) throw new NotFoundError('Category')
    if (category.userId !== userId) throw new ForbiddenError()

    const name = sanitizeText(input.name)
    const existing = await this.categoryRepo.findByNameAndUser(name, userId)
    if (existing && existing.id !== categoryId) {
      throw new ConflictError('You already have a category with this name')
    }

    const updated = await this.categoryRepo.update(categoryId, { name })
    return toCategoryDTO(updated)
  }

  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    const category = await this.categoryRepo.findById(categoryId)
    if (!category) throw new NotFoundError('Category')
    if (category.userId !== userId) throw new ForbiddenError()

    await this.taskCategoryRepo.removeAllForCategory(categoryId)
    await this.categoryRepo.delete(categoryId)
  }
}
