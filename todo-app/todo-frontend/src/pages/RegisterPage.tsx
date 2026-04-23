import { Navigate } from 'react-router-dom'

import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated } from '@/store/authSlice'
import { RegisterForm } from '@/components/auth/RegisterForm'

export function RegisterPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 p-4"
      data-testid="register-page"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            TodoApp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create your account</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
