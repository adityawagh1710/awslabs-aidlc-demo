import type { Category } from '@prisma/client'
import { prisma } from './prisma-client'

export class TaskCategoryRepository {
  async setCategories(taskId: string, categoryIds: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.taskCategory.deleteMany({ where: { taskId } }),
      prisma.taskCategory.createMany({
        data: categoryIds.map((categoryId) => ({ taskId, categoryId })),
        skipDuplicates: true,
      }),
    ])
  }

  async findCategoriesForTask(taskId: string): Promise<Category[]> {
    const rows = await prisma.taskCategory.findMany({
      where: { taskId },
      include: { category: true },
    })
    return rows.map((r) => r.category)
  }

  async removeAllForCategory(categoryId: string): Promise<void> {
    await prisma.taskCategory.deleteMany({ where: { categoryId } })
  }
}
