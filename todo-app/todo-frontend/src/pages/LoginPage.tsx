import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import {
  selectIsAuthenticated,
  selectSessionExpiredMessage,
} from '@/store/authSlice'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const sessionExpiredMessage = useAppSelector(selectSessionExpiredMessage)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 p-4"
      data-testid="login-page"
    >
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            TodoApp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back</p>
        </div>
        {sessionExpiredMessage && (
          <div
            className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
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
