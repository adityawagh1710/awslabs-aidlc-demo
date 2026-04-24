import { Link, Outlet, useLocation } from 'react-router-dom'
import { Tag, CheckSquare } from 'lucide-react'

import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser } from '@/store/authSlice'
import { useLogoutMutation } from '@/store/api/authApi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppShell() {
  const user = useAppSelector(selectCurrentUser)
  const [logout] = useLogoutMutation()
  const location = useLocation()

  const handleLogout = () => {
    const refreshToken = sessionStorage.getItem('refreshToken') ?? undefined
    logout({ refreshToken })
  }

  const navLink = (to: string) =>
    cn(
      'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-150',
      location.pathname === to
        ? 'bg-white/20 text-white font-medium'
        : 'text-violet-100 hover:bg-white/10 hover:text-white',
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40" data-testid="app-shell">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/20 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/20">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-white text-lg tracking-tight hover:opacity-90 mr-2"
              data-testid="app-shell-brand"
            >
              <CheckSquare className="h-5 w-5" />
              TodoApp
            </Link>
            <nav className="flex items-center gap-1">
              <Link to="/" className={navLink('/')} data-testid="app-shell-home-link">
                Tasks
              </Link>
              <Link to="/categories" className={navLink('/categories')} data-testid="app-shell-categories-link">
                <Tag className="h-3.5 w-3.5" />
                Categories
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-sm text-violet-100" data-testid="app-shell-user-email">
                  {user.email}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/30 text-white hover:bg-white/20 hover:text-white bg-transparent text-xs h-8"
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
