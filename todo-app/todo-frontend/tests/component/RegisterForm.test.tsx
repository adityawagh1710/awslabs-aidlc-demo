import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '../setup'
import { renderWithProviders } from '../utils/renderWithProviders'

import { RegisterForm } from '@/components/auth/RegisterForm'

describe('RegisterForm', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders all fields', () => {
    renderWithProviders(<RegisterForm />)
    expect(screen.getByTestId('register-form-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-form-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-form-confirm-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-form-submit-button')).toBeInTheDocument()
  })

  it('shows password mismatch error', async () => {
    renderWithProviders(<RegisterForm />)
    await userEvent.type(screen.getByTestId('register-form-email-input'), 'a@b.com')
    await userEvent.type(screen.getByTestId('register-form-password-input'), 'Password1')
    await userEvent.type(screen.getByTestId('register-form-confirm-password-input'), 'Different1')
    await userEvent.click(screen.getByTestId('register-form-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('shows short password error', async () => {
    renderWithProviders(<RegisterForm />)
    await userEvent.type(screen.getByTestId('register-form-email-input'), 'a@b.com')
    await userEvent.type(screen.getByTestId('register-form-password-input'), 'short')
    await userEvent.click(screen.getByTestId('register-form-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('submits successfully and stores refresh token', async () => {
    renderWithProviders(<RegisterForm />)
    await userEvent.type(screen.getByTestId('register-form-email-input'), 'new@example.com')
    await userEvent.type(screen.getByTestId('register-form-password-input'), 'Password1')
    await userEvent.type(screen.getByTestId('register-form-confirm-password-input'), 'Password1')
    await userEvent.click(screen.getByTestId('register-form-submit-button'))
    await waitFor(() => {
      expect(sessionStorage.getItem('refreshToken')).toBe('mock-refresh-token')
    })
  })

  it('shows conflict toast on 409', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 })
      )
    )
    renderWithProviders(<RegisterForm />)
    await userEvent.type(screen.getByTestId('register-form-email-input'), 'existing@example.com')
    await userEvent.type(screen.getByTestId('register-form-password-input'), 'Password1')
    await userEvent.type(screen.getByTestId('register-form-confirm-password-input'), 'Password1')
    await userEvent.click(screen.getByTestId('register-form-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/already registered/i)).toBeInTheDocument()
    })
  })

  it('shows rate-limit toast on 429', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        HttpResponse.json({ message: 'Too many requests' }, { status: 429 })
      )
    )
    renderWithProviders(<RegisterForm />)
    await userEvent.type(screen.getByTestId('register-form-email-input'), 'a@b.com')
    await userEvent.type(screen.getByTestId('register-form-password-input'), 'Password1')
    await userEvent.type(screen.getByTestId('register-form-confirm-password-input'), 'Password1')
    await userEvent.click(screen.getByTestId('register-form-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument()
    })
  })
})
