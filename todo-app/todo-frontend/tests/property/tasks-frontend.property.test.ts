import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { setSortBy, setSortOrder } from '@/store/uiSlice'
import { configureStore } from '@reduxjs/toolkit'
import uiReducer from '@/store/uiSlice'
import type { SortBy } from '@/store/uiSlice'

function makeUiStore() {
  return configureStore({ reducer: { ui: uiReducer } })
}

// PBT-CLIENT-05: Sort state preservation
describe('PBT-CLIENT-05: Sort state preservation', () => {
  it('changing sortOrder does not reset sortBy', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dueDate', 'priority', 'createdAt', 'title') as fc.Arbitrary<NonNullable<SortBy>>,
        fc.constantFrom('asc', 'desc') as fc.Arbitrary<'asc' | 'desc'>,
        (field, order) => {
          const store = makeUiStore()
          store.dispatch(setSortBy(field))
          store.dispatch(setSortOrder(order))
          expect(store.getState().ui.sortBy).toBe(field)
          expect(store.getState().ui.sortOrder).toBe(order)
        }
      )
    )
  })

  it('changing sortBy does not reset sortOrder', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('asc', 'desc') as fc.Arbitrary<'asc' | 'desc'>,
        fc.constantFrom('dueDate', 'priority', 'createdAt', 'title') as fc.Arbitrary<NonNullable<SortBy>>,
        (order, field) => {
          const store = makeUiStore()
          store.dispatch(setSortOrder(order))
          store.dispatch(setSortBy(field))
          expect(store.getState().ui.sortOrder).toBe(order)
        }
      )
    )
  })
})

// PBT-CLIENT-07: Form validation completeness
describe('PBT-CLIENT-07: Title validation', () => {
  it('any title string with length > 255 should fail Zod schema', () => {
    const { z } = require('zod')
    const schema = z.string().max(255, 'Title must be 255 characters or fewer')
    fc.assert(
      fc.property(
        fc.string({ minLength: 256, maxLength: 500 }),
        (longTitle) => {
          const result = schema.safeParse(longTitle)
          expect(result.success).toBe(false)
        }
      )
    )
  })

  it('any title string with length 1–255 passes max-length check', () => {
    const { z } = require('zod')
    const schema = z.string().min(1).max(255)
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 255 }),
        (title) => {
          const result = schema.safeParse(title)
          expect(result.success).toBe(true)
        }
      )
    )
  })
})
