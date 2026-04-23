import { describe, it, expect, vi } from 'vitest'
import { CategoryService } from '../../src/services/category.service'
import { ConflictError, ForbiddenError, NotFoundError } from '../../src/domain/errors'

function makeCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    colour: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function makeMocks() {
  const categoryRepo = {
    findAllByUser: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    findByNameAndUser: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  }
  const taskCategoryRepo = {
    setCategories: vi.fn().mockResolvedValue(undefined),
    findCategoriesForTask: vi.fn().mockResolvedValue([]),
    removeAllForCategory: vi.fn().mockResolvedValue(undefined),
  }
  return { categoryRepo, taskCategoryRepo }
}

describe('CategoryService', () => {
  describe('createCategory', () => {
    it('creates category with sanitized name', async () => {
      const { categoryRepo, taskCategoryRepo } = makeMocks()
      categoryRepo.create.mockResolvedValue(makeCategory({ name: '&#x3C;b&#x3E;Work&#x3C;/b&#x3E;' }))
      const svc = new CategoryService(categoryRepo as any, taskCategoryRepo as any)
      await svc.createCategory('user-1', { name: '<b>Work</b>' })
      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: '&#x3C;b&#x3E;Work&#x3C;/b&#x3E;' }),
      )
    })

    it('throws ConflictError when name already exists (case-insensitive via citext)', async () => {
      const { categoryRepo, taskCategoryRepo } = makeMocks()
      categoryRepo.findByNameAndUser.mockResolvedValue(makeCategory())
      const svc = new CategoryService(categoryRepo as any, taskCategoryRepo as any)
      await expect(svc.createCategory('user-1', { name: 'Work' })).rejects.toThrow(ConflictError)
    })
  })

  describe('updateCategory', () => {
    it('throws NotFoundError when category does not exist', async () => {
      const { categoryRepo, taskCategoryRepo } = makeMocks()
      categoryRepo.findById.mockResolvedValue(null)
      const svc = new CategoryService(categoryRepo as any, taskCategoryRepo as any)
      await expect(svc.updateCategory('cat-1', 'user-1', { name: 'New' })).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when category belongs to another user', async () => {
      const { categoryRepo, taskCategoryRepo } = makeMocks()
      categoryRepo.findById.mockResolvedValue(makeCategory({ userId: 'other' }))
      const svc = new CategoryService(categoryRepo as any, taskCategoryRepo as any)
      await expect(svc.updateCategory('cat-1', 'user-1', { name: 'New' })).rejects.toThrow(ForbiddenError)
    })

    it('allows rename to same name (self-exclusion check)', async () => {
      const { categoryRepo, taskCategoryRepo } = makeMocks()
      const cat = makeCategory()
      categoryRepo.findById.mockResolvedValue(cat)
      categoryRepo.findByNameAndUser.mockResolvedValue(cat) // finds itself
      categoryRepo.update.mockResolvedValue({ ...cat, name: 'Work' })
      const svc = new CategoryService(categoryRepo as any, taskCategoryRepo as any)
      await expect(svc.updateCategory('cat-1', 'user-1', { name: 'Work' })).resolves.toBeDefined()
    })
  })

  describe('deleteCategory', () => {
    it('removes task associations before deleting category', async () => {
      const { categoryRepo, taskCategoryRepo } = makeMocks()
      categoryRepo.findById.mockResolvedValue(makeCategory())
      const svc = new CategoryService(categoryRepo as any, taskCategoryRepo as any)
      await svc.deleteCategory('cat-1', 'user-1')
      expect(taskCategoryRepo.removeAllForCategory).toHaveBeenCalledWith('cat-1')
      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-1')
    })

    it('throws ForbiddenError for wrong user', async () => {
      const { categoryRepo, taskCategoryRepo } = makeMocks()
      categoryRepo.findById.mockResolvedValue(makeCategory({ userId: 'other' }))
      const svc = new CategoryService(categoryRepo as any, taskCategoryRepo as any)
      await expect(svc.deleteCategory('cat-1', 'user-1')).rejects.toThrow(ForbiddenError)
    })
  })
})
