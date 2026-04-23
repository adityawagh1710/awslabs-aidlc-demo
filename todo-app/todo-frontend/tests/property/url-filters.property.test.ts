import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ── Helpers (mirrors DashboardPage logic) ─────────────────────────────────────

function buildQueryArgs(params: URLSearchParams) {
  return {
    search: params.get('search') ?? undefined,
    status: params.get('status') ?? undefined,
    priority: params.getAll('priority').length ? params.getAll('priority') : undefined,
    categoryIds: params.getAll('categoryIds').length ? params.getAll('categoryIds') : undefined,
    dueDateFrom: params.get('dueDateFrom') ?? undefined,
    dueDateTo: params.get('dueDateTo') ?? undefined,
    page: params.get('page') ? Number(params.get('page')) : 1,
    pageSize: 25,
  }
}

function clearAllFilters(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams()
  if (params.get('sortBy')) next.set('sortBy', params.get('sortBy')!)
  if (params.get('sortOrder')) next.set('sortOrder', params.get('sortOrder')!)
  return next
}

// ── PBT-UI-01: buildQueryArgs is deterministic ────────────────────────────────
describe('PBT-UI-01: buildQueryArgs is deterministic', () => {
  it('same URLSearchParams always produces same queryArgs', () => {
    fc.assert(
      fc.property(
        fc.record({
          search: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          status: fc.option(fc.constantFrom('active', 'completed'), { nil: undefined }),
          page: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
        }),
        ({ search, status, page }) => {
          const params = new URLSearchParams()
          if (search) params.set('search', search)
          if (status) params.set('status', status)
          if (page) params.set('page', String(page))

          const a = buildQueryArgs(params)
          const b = buildQueryArgs(params)
          expect(a).toEqual(b)
        }
      )
    )
  })
})

// ── PBT-UI-02: clearAllFilters preserves sort params ─────────────────────────
describe('PBT-UI-02: clearAllFilters preserves sort, removes filters', () => {
  it('sort params are preserved; filter params are removed', () => {
    fc.assert(
      fc.property(
        fc.record({
          sortBy: fc.option(fc.constantFrom('dueDate', 'priority', 'createdAt', 'title'), { nil: undefined }),
          sortOrder: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
          search: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          status: fc.option(fc.constantFrom('active', 'completed'), { nil: undefined }),
        }),
        ({ sortBy, sortOrder, search, status }) => {
          const params = new URLSearchParams()
          if (sortBy) params.set('sortBy', sortBy)
          if (sortOrder) params.set('sortOrder', sortOrder)
          if (search) params.set('search', search)
          if (status) params.set('status', status)

          const cleared = clearAllFilters(params)

          // Sort preserved
          if (sortBy) expect(cleared.get('sortBy')).toBe(sortBy)
          if (sortOrder) expect(cleared.get('sortOrder')).toBe(sortOrder)

          // Filters removed
          expect(cleared.get('search')).toBeNull()
          expect(cleared.get('status')).toBeNull()
        }
      )
    )
  })
})

// ── PBT-UI-03: page always defaults to 1 when not set ────────────────────────
describe('PBT-UI-03: page defaults to 1 when absent', () => {
  it('queryArgs.page === 1 when no page param in URL', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        (search) => {
          const params = new URLSearchParams()
          if (search) params.set('search', search)
          // deliberately no 'page' param
          const args = buildQueryArgs(params)
          expect(args.page).toBe(1)
        }
      )
    )
  })
})

// ── PBT-UI-04: multi-value params round-trip through URLSearchParams ──────────
describe('PBT-UI-04: multi-value priority params round-trip', () => {
  it('priority array survives URLSearchParams serialization', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.constantFrom('Low', 'Medium', 'High'), { minLength: 1, maxLength: 3 }),
        (priorities) => {
          const params = new URLSearchParams()
          priorities.forEach((p) => params.append('priority', p))
          const args = buildQueryArgs(params)
          expect(args.priority).toEqual(priorities)
        }
      )
    )
  })
})
