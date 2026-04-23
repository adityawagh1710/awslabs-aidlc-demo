import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../utils/renderWithProviders'

import { DashboardPage } from '@/pages/DashboardPage'

describe('DashboardPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByRole('heading', { name: 'My Tasks' })).toBeInTheDocument()
  })

  it('renders the New Task button', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByTestId('dashboard-new-task-button')).toBeInTheDocument()
  })

  it('renders sort controls', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByTestId('sort-controls')).toBeInTheDocument()
  })

  it('renders the task list table', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByTestId('task-list')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByTestId('search-input')).toBeInTheDocument()
  })

  it('renders filter bar', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument()
  })

  it('does not render active filters bar when no filters active', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.queryByTestId('active-filters-bar')).not.toBeInTheDocument()
  })

  it('renders active filters bar when URL has filter params', () => {
    renderWithProviders(<DashboardPage />, { initialEntries: ['/?status=active'] })
    expect(screen.getByTestId('active-filters-bar')).toBeInTheDocument()
  })
})
