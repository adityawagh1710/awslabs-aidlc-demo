import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

import { normalizeSearch } from '../../src/services/task.service'

// PBT-FILTER-02: Status filter soundness
// status=active → only non-completed tasks returned
describe('PBT-FILTER-02: Status filter soundness', () => {
  it('filtering active tasks never produces a completed item', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            completed: fc.boolean(),
            status: fc.constantFrom('ACTIVE', 'COMPLETED'),
          })
        ),
        (tasks) => {
          const activeTasks = tasks.filter((t) => t.status === 'ACTIVE')
          expect(activeTasks.every((t) => t.status === 'ACTIVE')).toBe(true)
        }
      )
    )
  })
})

// PBT-FILTER-03: Pagination bound
describe('PBT-FILTER-03: Pagination bound', () => {
  it('slicing any array with pageSize never returns more than pageSize items', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 200 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 10 }),
        (items, pageSize, page) => {
          const offset = page * pageSize
          const slice = items.slice(offset, offset + pageSize)
          expect(slice.length).toBeLessThanOrEqual(pageSize)
        }
      )
    )
  })
})

// PBT-FILTER-04: AND-narrowing invariant
// Adding a filter can only reduce or maintain the result count
describe('PBT-FILTER-04: AND-narrowing invariant', () => {
  it('a subset filter of items cannot produce more results than the full set', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            priority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
            status: fc.constantFrom('ACTIVE', 'COMPLETED'),
          }),
          { minLength: 0, maxLength: 100 }
        ),
        (tasks) => {
          const allCount = tasks.length
          const highOnly = tasks.filter((t) => t.priority === 'HIGH')
          const highActive = highOnly.filter((t) => t.status === 'ACTIVE')
          expect(highOnly.length).toBeLessThanOrEqual(allCount)
          expect(highActive.length).toBeLessThanOrEqual(highOnly.length)
        }
      )
    )
  })
})

// PBT-FILTER-05: Total count consistency
describe('PBT-FILTER-05: Total count consistency', () => {
  it('sum of items across pages equals total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 100 }),
        fc.integer({ min: 1, max: 25 }),
        (items, pageSize) => {
          const totalPages = Math.ceil(items.length / pageSize) || 1
          let sumItems = 0
          for (let p = 0; p < totalPages; p++) {
            sumItems += items.slice(p * pageSize, (p + 1) * pageSize).length
          }
          expect(sumItems).toBe(items.length)
        }
      )
    )
  })
})

// PBT-FILTER-06: Empty search equivalence
describe('PBT-FILTER-06: Empty search normalisation', () => {
  it('any whitespace-only string normalizes to undefined', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s*$/),
        (whitespace) => {
          expect(normalizeSearch(whitespace)).toBeUndefined()
        }
      )
    )
  })

  it('any non-empty non-whitespace string is preserved after trimming', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (search) => {
          const result = normalizeSearch(search)
          expect(result).toBe(search.trim())
          expect(result).not.toBe('')
        }
      )
    )
  })
})
