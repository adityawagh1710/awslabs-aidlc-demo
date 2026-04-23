import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import authReducer from '@/store/authSlice'
import uiReducer from '@/store/uiSlice'
import { authApi } from '@/store/api/authApi'
import { tasksApi } from '@/store/api/tasksApi'
import { categoriesApi } from '@/store/api/categoriesApi'
import type { RootState } from '@/store'
import { Toaster } from '@/components/ui/toaster'
import { ReduxToaster } from '@/components/shared/Toaster'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    initialEntries = ['/'],
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = (configureStore as any)({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [authApi.reducerPath]: authApi.reducer,
      [tasksApi.reducerPath]: tasksApi.reducer,
      [categoriesApi.reducerPath]: categoriesApi.reducer,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    middleware: (getDefaultMiddleware: any) =>
      getDefaultMiddleware()
        .concat(authApi.middleware)
        .concat(tasksApi.middleware)
        .concat(categoriesApi.middleware),
    preloadedState,
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
          <Toaster />
          <ReduxToaster />
        </MemoryRouter>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
