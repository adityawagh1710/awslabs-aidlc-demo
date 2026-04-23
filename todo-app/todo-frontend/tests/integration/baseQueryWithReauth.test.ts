import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../setup'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, { setCredentials } from '@/store/authSlice'
import uiReducer from '@/store/uiSlice'
import { authApi } from '@/store/api/authApi'

const mockUser = { id: 'u1', email: 'test@example.com', createdAt: '2026-01-01T00:00:00Z' }

function makeStore(preloadedState?: object) {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
    preloadedState: preloadedState as never,
  })
}

describe('baseQueryWithReauth', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('successful login stores refresh token in sessionStorage', async () => {
    const store = makeStore()
    await store.dispatch(authApi.endpoints.login.initiate({ email: 'a@b.com', password: 'pw' }))
    expect(sessionStorage.getItem('refreshToken')).toBe('mock-refresh-token')
  })

  it('clears credentials when refresh fails on 401', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      ),
      http.post('/api/v1/auth/refresh', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      )
    )
    sessionStorage.setItem('refreshToken', 'expired-token')
    const store = makeStore({
      auth: { accessToken: 'old-token', user: mockUser, isInitialised: true, sessionExpiredMessage: null },
    })
    await store.dispatch(authApi.endpoints.login.initiate({ email: 'a@b.com', password: 'bad' }))
    // After failed refresh, credentials should be cleared
    const state = store.getState()
    expect(state.auth.accessToken).toBeNull()
  })

  it('logout clears credentials optimistically', async () => {
    const store = makeStore({
      auth: { accessToken: 'tok', user: mockUser, isInitialised: true, sessionExpiredMessage: null },
    })
    store.dispatch(setCredentials({ accessToken: 'tok', user: mockUser }))
    sessionStorage.setItem('refreshToken', 'rt')
    await store.dispatch(authApi.endpoints.logout.initiate({ refreshToken: 'rt' }))
    expect(store.getState().auth.accessToken).toBeNull()
    expect(sessionStorage.getItem('refreshToken')).toBeNull()
  })
})
