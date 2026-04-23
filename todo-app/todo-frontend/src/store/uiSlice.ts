import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export type SortBy = 'dueDate' | 'priority' | 'createdAt' | 'title' | null
export type SortOrder = 'asc' | 'desc'

export interface UiState {
  returnTo: string | null
  toasts: Toast[]
  sortBy: SortBy
  sortOrder: SortOrder
}

const initialState: UiState = {
  returnTo: null,
  toasts: [],
  sortBy: null,
  sortOrder: 'asc',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setReturnTo(state, action: PayloadAction<string>) {
      state.returnTo = action.payload
    },
    clearReturnTo(state) {
      state.returnTo = null
    },
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      state.toasts.push({ id, ...action.payload })
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
    setSortBy(state, action: PayloadAction<SortBy>) {
      state.sortBy = action.payload
    },
    setSortOrder(state, action: PayloadAction<SortOrder>) {
      state.sortOrder = action.payload
    },
  },
})

export const { setReturnTo, clearReturnTo, addToast, removeToast, setSortBy, setSortOrder } =
  uiSlice.actions

// Selectors
export const selectReturnTo = (state: RootState) => state.ui.returnTo
export const selectToasts = (state: RootState) => state.ui.toasts
export const selectSortBy = (state: RootState) => state.ui.sortBy
export const selectSortOrder = (state: RootState) => state.ui.sortOrder

export default uiSlice.reducer
