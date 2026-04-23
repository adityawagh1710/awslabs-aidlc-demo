import { useEffect, useRef } from 'react'

import { useAppDispatch } from '@/store/hooks'
import { setCredentials, setInitialised } from '@/store/authSlice'
import { useRefreshMutation } from '@/store/api/authApi'
import type { UserDto } from '@/types/api'

/**
 * Restores the session on page load/refresh.
 *
 * sessionStorage persists across refreshes within the same tab but is
 * cleared when the tab/window is closed — giving "stay logged in until
 * window closes" behaviour without any beforeunload hacks.
 *
 * On refresh:
 *  1. Immediately restore credentials from sessionStorage (instant, no flicker)
 *  2. Silently call /auth/refresh to rotate the tokens in the background
 */
export function PersistAuth({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const [refresh] = useRefreshMutation()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const storedRefreshToken = sessionStorage.getItem('refreshToken')
    const storedAccessToken = sessionStorage.getItem('accessToken')
    const storedUser = sessionStorage.getItem('user')

    // Nothing stored — fresh session, just mark initialised
    if (!storedRefreshToken || !storedUser) {
      dispatch(setInitialised(true))
      return
    }

    let user: UserDto
    try {
      user = JSON.parse(storedUser) as UserDto
    } catch {
      sessionStorage.clear()
      dispatch(setInitialised(true))
      return
    }

    // Step 1: Immediately restore from sessionStorage so the UI doesn't flash
    // to the login page while the refresh call is in flight.
    if (storedAccessToken) {
      dispatch(setCredentials({ accessToken: storedAccessToken, user }))
      dispatch(setInitialised(true))
    }

    // Step 2: Silently rotate tokens in the background
    refresh({ refreshToken: storedRefreshToken })
      .unwrap()
      .then((data) => {
        sessionStorage.setItem('refreshToken', data.refreshToken)
        sessionStorage.setItem('accessToken', data.accessToken)
        dispatch(setCredentials({ accessToken: data.accessToken, user }))
        if (!storedAccessToken) dispatch(setInitialised(true))
      })
      .catch(() => {
        // Refresh token expired or revoked — clear everything and force login
        sessionStorage.removeItem('refreshToken')
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('user')
        dispatch(setInitialised(true))
      })
  }, [dispatch, refresh])

  return <>{children}</>
}
