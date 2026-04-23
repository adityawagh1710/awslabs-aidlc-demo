import { CategoryRepository } from '../repositories/category.repository'

export class CategoryValidationService {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  /**
   * Returns IDs from categoryIds that are not found or not owned by userId.
   * Empty array means all IDs are valid.
   */
  async validateOwnership(categoryIds: string[], userId: string): Promise<string[]> {
    if (categoryIds.length === 0) return []

    const found = await Promise.all(
      categoryIds.map((id) => this.categoryRepo.findById(id)),
    )

    return categoryIds.filter((id, i) => {
      const cat = found[i]
      return cat === null || cat.userId !== userId
    })
  }
}
