import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { UserDto } from '@/types/api'

export interface AuthState {
  accessToken: string | null
  user: UserDto | null
  isInitialised: boolean
  sessionExpiredMessage: string | null
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isInitialised: false,
  sessionExpiredMessage: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: UserDto }>
    ) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.sessionExpiredMessage = null
    },
    clearCredentials(state) {
      state.accessToken = null
      state.user = null
    },
    setInitialised(state, action: PayloadAction<boolean>) {
      state.isInitialised = action.payload
    },
    setSessionExpiredMessage(state, action: PayloadAction<string | null>) {
      state.sessionExpiredMessage = action.payload
    },
  },
})

export const {
  setCredentials,
  clearCredentials,
  setInitialised,
  setSessionExpiredMessage,
} = authSlice.actions

// Selectors
export const selectAccessToken = (state: RootState) => state.auth.accessToken
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsInitialised = (state: RootState) => state.auth.isInitialised
export const selectSessionExpiredMessage = (state: RootState) =>
  state.auth.sessionExpiredMessage
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.accessToken !== null

export default authSlice.reducer
