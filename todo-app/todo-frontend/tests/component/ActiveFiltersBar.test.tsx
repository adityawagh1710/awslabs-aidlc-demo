import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../utils/renderWithProviders'

import { ActiveFiltersBar, type ActiveFilter } from '@/components/tasks/ActiveFiltersBar'

const makeFilters = (overrides: Partial<ActiveFilter>[] = []): ActiveFilter[] =>
  overrides.map((o, i) => ({
    key: `filter-${i}`,
    label: `Filter ${i}`,
    onRemove: vi.fn(),
    ...o,
  }))

describe('ActiveFiltersBar', () => {
  it('renders nothing when no active filters', () => {
    renderWithProviders(<ActiveFiltersBar activeFilters={[]} onClearAll={vi.fn()} />)
    expect(screen.queryByTestId('active-filters-bar')).not.toBeInTheDocument()
  })

  it('renders chips for each active filter', () => {
    const filters = makeFilters([{ key: 'search', label: 'Search: urgent' }, { key: 'status', label: 'Status: Active' }])
    renderWithProviders(<ActiveFiltersBar activeFilters={filters} onClearAll={vi.fn()} />)
    expect(screen.getByTestId('active-filter-chip-search')).toBeInTheDocument()
    expect(screen.getByTestId('active-filter-chip-status')).toBeInTheDocument()
  })

  it('calls onRemove when × clicked on a chip', async () => {
    const onRemove = vi.fn()
    const filters = makeFilters([{ key: 'search', label: 'Search: urgent', onRemove }])
    renderWithProviders(<ActiveFiltersBar activeFilters={filters} onClearAll={vi.fn()} />)
    await userEvent.click(screen.getByTestId('active-filter-remove-search'))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('calls onClearAll when Clear all clicked', async () => {
    const onClearAll = vi.fn()
    const filters = makeFilters([{ key: 'status', label: 'Status: Active' }])
    renderWithProviders(<ActiveFiltersBar activeFilters={filters} onClearAll={onClearAll} />)
    await userEvent.click(screen.getByTestId('active-filters-clear-all'))
    expect(onClearAll).toHaveBeenCalledOnce()
  })
})
