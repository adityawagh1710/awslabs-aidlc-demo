import { Link, Outlet } from 'react-router-dom'
import { Tag } from 'lucide-react'

import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser } from '@/store/authSlice'
import { useLogoutMutation } from '@/store/api/authApi'
import { Button } from '@/components/ui/button'

export function AppShell() {
  const user = useAppSelector(selectCurrentUser)
  const [logout] = useLogoutMutation()

  const handleLogout = () => {
    const refreshToken = sessionStorage.getItem('refreshToken') ?? undefined
    logout({ refreshToken })
  }

  return (
    <div className="min-h-screen bg-background" data-testid="app-shell">
      <header className="border-b bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-white text-lg tracking-tight hover:opacity-90"
              data-testid="app-shell-brand"
            >
              ✅ TodoApp
            </Link>
            <Link
              to="/categories"
              className="flex items-center gap-1.5 text-sm text-violet-100 hover:text-white transition-colors"
              data-testid="app-shell-categories-link"
            >
              <Tag className="h-4 w-4" />
              Categories
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-violet-200" data-testid="app-shell-user-email">
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/30 text-white hover:bg-white/20 hover:text-white bg-transparent"
              data-testid="app-shell-logout-button"
            >
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
