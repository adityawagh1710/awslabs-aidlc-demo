import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/renderWithProviders'
import { FilterBar } from '@/components/tasks/FilterBar'

const mockCategories = [
  { id: 'cat-1', name: 'Work', colour: null, createdAt: '', updatedAt: '' },
  { id: 'cat-2', name: 'Personal', colour: null, createdAt: '', updatedAt: '' },
]

describe('FilterBar', () => {
  it('renders all status buttons', () => {
    renderWithProviders(
      <FilterBar params={new URLSearchParams()} onFilterChange={vi.fn()} categories={[]} />
    )
    expect(screen.getByTestId('filter-status-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-status-active')).toBeInTheDocument()
    expect(screen.getByTestId('filter-status-completed')).toBeInTheDocument()
  })

  it('renders priority chips', () => {
    renderWithProviders(
      <FilterBar params={new URLSearchParams()} onFilterChange={vi.fn()} categories={[]} />
    )
    expect(screen.getByTestId('filter-priority-Low')).toBeInTheDocument()
    expect(screen.getByTestId('filter-priority-Medium')).toBeInTheDocument()
    expect(screen.getByTestId('filter-priority-High')).toBeInTheDocument()
  })

  it('calls onFilterChange with status=active when Active clicked', async () => {
    const onFilterChange = vi.fn()
    renderWithProviders(
      <FilterBar params={new URLSearchParams()} onFilterChange={onFilterChange} categories={[]} />
    )
    await userEvent.click(screen.getByTestId('filter-status-active'))
    expect(onFilterChange).toHaveBeenCalledWith({ status: 'active' })
  })

  it('calls onFilterChange with null status when All clicked', async () => {
    const onFilterChange = vi.fn()
    const params = new URLSearchParams('status=active')
    renderWithProviders(
      <FilterBar params={params} onFilterChange={onFilterChange} categories={[]} />
    )
    await userEvent.click(screen.getByTestId('filter-status-all'))
    expect(onFilterChange).toHaveBeenCalledWith({ status: null })
  })

  it('toggles priority multi-select', async () => {
    const onFilterChange = vi.fn()
    renderWithProviders(
      <FilterBar params={new URLSearchParams()} onFilterChange={onFilterChange} categories={[]} />
    )
    await userEvent.click(screen.getByTestId('filter-priority-High'))
    expect(onFilterChange).toHaveBeenCalledWith({ priority: ['High'] })
  })

  it('renders category chips when categories provided', () => {
    renderWithProviders(
      <FilterBar params={new URLSearchParams()} onFilterChange={vi.fn()} categories={mockCategories} />
    )
    expect(screen.getByTestId('filter-category-cat-1')).toBeInTheDocument()
    expect(screen.getByTestId('filter-category-cat-2')).toBeInTheDocument()
  })

  it('renders date range inputs', () => {
    renderWithProviders(
      <FilterBar params={new URLSearchParams()} onFilterChange={vi.fn()} categories={[]} />
    )
    expect(screen.getByTestId('filter-date-from')).toBeInTheDocument()
    expect(screen.getByTestId('filter-date-to')).toBeInTheDocument()
  })
})
