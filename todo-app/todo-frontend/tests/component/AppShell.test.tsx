import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/renderWithProviders'
import { AppShell } from '@/components/layout/AppShell'

const mockUser = { id: 'u1', email: 'user@example.com', createdAt: '2026-01-01T00:00:00Z' }

describe('AppShell', () => {
  beforeEach(() => {
    sessionStorage.setItem('refreshToken', 'stored-refresh-token')
  })

  it('renders user email', () => {
    renderWithProviders(<AppShell />, {
      preloadedState: {
        auth: { accessToken: 'tok', user: mockUser, isInitialised: true, sessionExpiredMessage: null },
      },
    })
    expect(screen.getByTestId('app-shell-user-email')).toHaveTextContent('user@example.com')
  })

  it('logout button clears sessionStorage', async () => {
    renderWithProviders(<AppShell />, {
      preloadedState: {
        auth: { accessToken: 'tok', user: mockUser, isInitialised: true, sessionExpiredMessage: null },
      },
    })
    await userEvent.click(screen.getByTestId('app-shell-logout-button'))
    await waitFor(() => {
      expect(sessionStorage.getItem('refreshToken')).toBeNull()
    })
  })
})
