import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../setup'
import { renderWithProviders } from '../utils/renderWithProviders'
import { LoginForm } from '@/components/auth/LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders email and password fields', () => {
    renderWithProviders(<LoginForm />)
    expect(screen.getByTestId('login-form-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-form-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-form-submit-button')).toBeInTheDocument()
  })

  it('shows Zod validation errors for empty submit', async () => {
    renderWithProviders(<LoginForm />)
    await userEvent.click(screen.getByTestId('login-form-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('submits successfully and stores refresh token', async () => {
    renderWithProviders(<LoginForm />)
    await userEvent.type(screen.getByTestId('login-form-email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('login-form-password-input'), 'Password1')
    await userEvent.click(screen.getByTestId('login-form-submit-button'))
    await waitFor(() => {
      expect(sessionStorage.getItem('refreshToken')).toBe('mock-refresh-token')
    })
  })

  it('shows destructive toast on 401', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      )
    )
    renderWithProviders(<LoginForm />)
    await userEvent.type(screen.getByTestId('login-form-email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('login-form-password-input'), 'WrongPass1')
    await userEvent.click(screen.getByTestId('login-form-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument()
    })
  })

  it('shows rate-limit toast on 429', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ message: 'Too many requests' }, { status: 429 })
      )
    )
    renderWithProviders(<LoginForm />)
    await userEvent.type(screen.getByTestId('login-form-email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('login-form-password-input'), 'Password1')
    await userEvent.click(screen.getByTestId('login-form-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument()
    })
  })
})
