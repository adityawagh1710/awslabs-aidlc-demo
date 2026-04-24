import { Navigate } from 'react-router-dom'

import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectSessionExpiredMessage } from '@/store/authSlice'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const sessionExpiredMessage = useAppSelector(selectSessionExpiredMessage)

  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100"
      data-testid="login-page"
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-300/50 mb-4 text-2xl">
            ✅
          </div>
          <h1 className="text-2xl font-bold gradient-text">TodoApp</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {sessionExpiredMessage && (
          <div
            className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            role="alert"
            data-testid="session-expired-banner"
          >
            {sessionExpiredMessage}
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
