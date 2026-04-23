import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/store/api/apiSlice'
import { setCredentials, clearCredentials } from '@/store/authSlice'
import type {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  LogoutRequest,
  AuthResponse,
  RefreshResponse,
} from '@/types/api'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }))
          sessionStorage.setItem('refreshToken', data.refreshToken)
          sessionStorage.setItem('user', JSON.stringify(data.user))
          sessionStorage.setItem('accessToken', data.accessToken)
        } catch {
          // handled by component
        }
      },
    }),

    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }))
          sessionStorage.setItem('refreshToken', data.refreshToken)
          sessionStorage.setItem('user', JSON.stringify(data.user))
          sessionStorage.setItem('accessToken', data.accessToken)
        } catch {
          // handled by component
        }
      },
    }),

    refresh: builder.mutation<RefreshResponse, RefreshRequest>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    logout: builder.mutation<void, LogoutRequest>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Optimistic clear — don't wait for server
        dispatch(clearCredentials())
        sessionStorage.removeItem('refreshToken')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('accessToken')
        try {
          await queryFulfilled
        } catch {
          // Already cleared locally; server-side blacklist may have failed but that's acceptable
        }
      },
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
} = authApi
