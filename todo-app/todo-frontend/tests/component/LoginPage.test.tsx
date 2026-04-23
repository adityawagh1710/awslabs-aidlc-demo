import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../utils/renderWithProviders'

import { LoginPage } from '@/pages/LoginPage'

describe('LoginPage', () => {
  it('renders login form when unauthenticated', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: { accessToken: null, user: null, isInitialised: true, sessionExpiredMessage: null },
      },
    })
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('shows session expired banner when message is set', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: {
          accessToken: null,
          user: null,
          isInitialised: true,
          sessionExpiredMessage: 'Your session has expired.',
        },
      },
    })
    expect(screen.getByTestId('session-expired-banner')).toBeInTheDocument()
    expect(screen.getByText(/session has expired/i)).toBeInTheDocument()
  })

  it('does not show banner when no expiry message', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: { accessToken: null, user: null, isInitialised: true, sessionExpiredMessage: null },
      },
    })
    expect(screen.queryByTestId('session-expired-banner')).not.toBeInTheDocument()
  })
})
