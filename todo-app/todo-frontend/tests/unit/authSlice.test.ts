import { describe, it, expect } from 'vitest'
import authReducer, {
  setCredentials,
  clearCredentials,
  setInitialised,
  setSessionExpiredMessage,
  selectAccessToken,
  selectCurrentUser,
  selectIsInitialised,
  selectSessionExpiredMessage,
  selectIsAuthenticated,
  type AuthState,
} from '@/store/authSlice'

const mockUser = { id: 'u1', email: 'test@example.com', createdAt: '2026-01-01T00:00:00Z' }

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isInitialised: false,
  sessionExpiredMessage: null,
}

describe('authSlice', () => {
  it('returns initial state', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  it('setCredentials stores token and user, clears expiry message', () => {
    const state = authReducer(
      { ...initialState, sessionExpiredMessage: 'expired' },
      setCredentials({ accessToken: 'tok', user: mockUser })
    )
    expect(state.accessToken).toBe('tok')
    expect(state.user).toEqual(mockUser)
    expect(state.sessionExpiredMessage).toBeNull()
  })

  it('clearCredentials nulls token and user', () => {
    const state = authReducer(
      { ...initialState, accessToken: 'tok', user: mockUser },
      clearCredentials()
    )
    expect(state.accessToken).toBeNull()
    expect(state.user).toBeNull()
  })

  it('setInitialised sets the flag', () => {
    const state = authReducer(initialState, setInitialised(true))
    expect(state.isInitialised).toBe(true)
  })

  it('setSessionExpiredMessage stores the message', () => {
    const state = authReducer(initialState, setSessionExpiredMessage('Session expired'))
    expect(state.sessionExpiredMessage).toBe('Session expired')
  })

  describe('selectors', () => {
    const rootState = {
      auth: { ...initialState, accessToken: 'tok', user: mockUser, isInitialised: true },
      ui: { returnTo: null, toasts: [] },
    } as never

    it('selectAccessToken', () => expect(selectAccessToken(rootState)).toBe('tok'))
    it('selectCurrentUser', () => expect(selectCurrentUser(rootState)).toEqual(mockUser))
    it('selectIsInitialised', () => expect(selectIsInitialised(rootState)).toBe(true))
    it('selectIsAuthenticated', () => expect(selectIsAuthenticated(rootState)).toBe(true))
    it('selectSessionExpiredMessage', () =>
      expect(selectSessionExpiredMessage(rootState)).toBeNull())
  })
})
