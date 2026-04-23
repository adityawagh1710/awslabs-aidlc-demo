import { describe, it, expect } from 'vitest'

import uiReducer, {
  setReturnTo,
  clearReturnTo,
  addToast,
  removeToast,
  setSortBy,
  setSortOrder,
  selectReturnTo,
  selectToasts,
  selectSortBy,
  selectSortOrder,
  type UiState,
} from '@/store/uiSlice'

const initialState: UiState = { returnTo: null, toasts: [], sortBy: null, sortOrder: 'asc' }

describe('uiSlice', () => {
  it('returns initial state', () => {
    expect(uiReducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  it('setReturnTo stores path', () => {
    const state = uiReducer(initialState, setReturnTo('/dashboard'))
    expect(state.returnTo).toBe('/dashboard')
  })

  it('clearReturnTo nulls path', () => {
    const state = uiReducer({ ...initialState, returnTo: '/dashboard' }, clearReturnTo())
    expect(state.returnTo).toBeNull()
  })

  it('addToast generates a unique id', () => {
    const s1 = uiReducer(initialState, addToast({ title: 'A' }))
    const s2 = uiReducer(s1, addToast({ title: 'B' }))
    expect(s2.toasts).toHaveLength(2)
    expect(s2.toasts[0].id).not.toBe(s2.toasts[1].id)
  })

  it('removeToast removes by id', () => {
    const s1 = uiReducer(initialState, addToast({ title: 'A' }))
    const id = s1.toasts[0].id
    const s2 = uiReducer(s1, removeToast(id))
    expect(s2.toasts).toHaveLength(0)
  })

  describe('sort state', () => {
    it('setSortBy sets the sort field', () => {
      const state = uiReducer(initialState, setSortBy('dueDate'))
      expect(state.sortBy).toBe('dueDate')
    })

    it('setSortBy accepts null to clear sort', () => {
      const withSort = { ...initialState, sortBy: 'title' as const }
      const state = uiReducer(withSort, setSortBy(null))
      expect(state.sortBy).toBeNull()
    })

    it('setSortOrder updates direction', () => {
      const state = uiReducer(initialState, setSortOrder('desc'))
      expect(state.sortOrder).toBe('desc')
    })

    it('changing sortBy does not reset sortOrder', () => {
      const withDesc = uiReducer(initialState, setSortOrder('desc'))
      const state = uiReducer(withDesc, setSortBy('priority'))
      expect(state.sortOrder).toBe('desc')
    })

    it('changing sortOrder does not reset sortBy', () => {
      const withSort = uiReducer(initialState, setSortBy('title'))
      const state = uiReducer(withSort, setSortOrder('asc'))
      expect(state.sortBy).toBe('title')
    })
  })

  describe('selectors', () => {
    const rootState = {
      auth: { accessToken: null, user: null, isInitialised: false, sessionExpiredMessage: null },
      ui: { returnTo: '/tasks', toasts: [{ id: 't1', title: 'Hi' }], sortBy: 'dueDate', sortOrder: 'asc' },
    } as never

    it('selectReturnTo', () => expect(selectReturnTo(rootState)).toBe('/tasks'))
    it('selectToasts', () => expect(selectToasts(rootState)).toHaveLength(1))
    it('selectSortBy', () => expect(selectSortBy(rootState)).toBe('dueDate'))
    it('selectSortOrder', () => expect(selectSortOrder(rootState)).toBe('asc'))
  })
})
