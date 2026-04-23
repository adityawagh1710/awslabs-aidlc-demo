import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react'

import type { RootState } from '@/store'
import {
  clearCredentials,
  setCredentials,
  setSessionExpiredMessage,
} from '@/store/authSlice'
import type { RefreshResponse } from '@/types/api'

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Mutex to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    const refreshToken = sessionStorage.getItem('refreshToken')

    if (!refreshToken) {
      api.dispatch(clearCredentials())
      api.dispatch(setSessionExpiredMessage('Your session has expired. Please log in again.'))
      return result
    }

    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = (async () => {
        try {
          const refreshResult = await baseQuery(
            { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
            api,
            extraOptions,
          )
          if (refreshResult.data) {
            const { accessToken, refreshToken: newRefreshToken } =
              refreshResult.data as RefreshResponse
            const user = (api.getState() as RootState).auth.user!
            api.dispatch(setCredentials({ accessToken, user }))
            sessionStorage.setItem('refreshToken', newRefreshToken)
            sessionStorage.setItem('accessToken', accessToken)
            return true
          } else {
            api.dispatch(clearCredentials())
            sessionStorage.removeItem('refreshToken')
            sessionStorage.removeItem('user')
            sessionStorage.removeItem('accessToken')
            api.dispatch(setSessionExpiredMessage('Your session has expired. Please log in again.'))
            return false
          }
        } finally {
          isRefreshing = false
          refreshPromise = null
        }
      })()
    }

    const refreshed = await refreshPromise
    if (refreshed) {
      result = await baseQuery(args, api, extraOptions)
    }
  }

  return result
}
