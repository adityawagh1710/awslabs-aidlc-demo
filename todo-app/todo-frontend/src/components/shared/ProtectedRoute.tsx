import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectIsAuthenticated,
  selectIsInitialised,
} from '@/store/authSlice'
import { setReturnTo } from '@/store/uiSlice'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

/**
 * Two-stage guard:
 * 1. While auth is not yet initialised (PersistAuth still running) → show spinner
 * 2. Once initialised: if no access token → redirect to /login; else → render Outlet
 */
export function ProtectedRoute() {
  const isInitialised = useAppSelector(selectIsInitialised)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()
  const dispatch = useAppDispatch()

  if (!isInitialised) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        data-testid="protected-route-loading"
      >
        <LoadingSpinner size="lg" label="Restoring session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    dispatch(setReturnTo(location.pathname))
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
