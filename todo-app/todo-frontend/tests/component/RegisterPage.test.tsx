import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/renderWithProviders'
import { RegisterPage } from '@/pages/RegisterPage'

describe('RegisterPage', () => {
  it('renders register form when unauthenticated', () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: {
        auth: { accessToken: null, user: null, isInitialised: true, sessionExpiredMessage: null },
      },
    })
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
  })
})
