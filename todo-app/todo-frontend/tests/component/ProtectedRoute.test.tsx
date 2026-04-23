import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../utils/renderWithProviders'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

describe('ProtectedRoute', () => {
  it('shows spinner when not initialised', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
      </Routes>,
      {
        preloadedState: {
          auth: { accessToken: null, user: null, isInitialised: false, sessionExpiredMessage: null },
        },
      }
    )
    expect(screen.getByTestId('protected-route-loading')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to /login when no token', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
      </Routes>,
      {
        preloadedState: {
          auth: { accessToken: null, user: null, isInitialised: true, sessionExpiredMessage: null },
        },
      }
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
      </Routes>,
      {
        preloadedState: {
          auth: {
            accessToken: 'tok',
            user: { id: 'u1', email: 'a@b.com', createdAt: '' },
            isInitialised: true,
            sessionExpiredMessage: null,
          },
        },
      }
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
