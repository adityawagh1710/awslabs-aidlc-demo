import type { Category } from '@prisma/client'

import { prisma } from './prisma-client'

export interface CreateCategoryData {
  userId: string
  name: string
}

export interface UpdateCategoryData {
  name: string
}

export class CategoryRepository {
  async findAllByUser(userId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } })
  }

  // citext column handles case-insensitive comparison automatically
  async findByNameAndUser(name: string, userId: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { userId, name },
    })
  }

  async create(data: CreateCategoryData): Promise<Category> {
    return prisma.category.create({ data })
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    return prisma.category.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } })
  }
}
