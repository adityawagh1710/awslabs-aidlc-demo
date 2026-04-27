import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../utils/renderWithProviders'

import { SearchInput } from '@/components/tasks/SearchInput'

describe('SearchInput', () => {
  it('renders input field', () => {
    renderWithProviders(<SearchInput value="" onSearch={vi.fn()} />)
    expect(screen.getByTestId('search-input-field')).toBeInTheDocument()
  })

  it('calls onSearch with trimmed value after debounce when typing', async () => {
    const onSearch = vi.fn()
    renderWithProviders(<SearchInput value="" onSearch={onSearch} />)
    await userEvent.type(screen.getByTestId('search-input-field'), '  buy milk  ')
    await waitFor(() => {
      expect(onSearch).toHaveBeenLastCalledWith('buy milk')
    }, { timeout: 1000 })
  })

  it('calls onSearch via debounce after typing', async () => {
    const onSearch = vi.fn()
    renderWithProviders(<SearchInput value="" onSearch={onSearch} />)
    await userEvent.type(screen.getByTestId('search-input-field'), 'urgent')
    await waitFor(() => {
      expect(onSearch).toHaveBeenLastCalledWith('urgent')
    }, { timeout: 1000 })
  })

  it('calls onSearch with empty string when clear button clicked', async () => {
    const onSearch = vi.fn()
    renderWithProviders(<SearchInput value="x" onSearch={onSearch} />)
    await userEvent.click(screen.getByLabelText('Clear search'))
    expect(onSearch).toHaveBeenCalledWith('')
  })

  it('syncs local state when value prop changes', () => {
    const { rerender } = renderWithProviders(<SearchInput value="old" onSearch={vi.fn()} />)
    expect(screen.getByTestId('search-input-field')).toHaveValue('old')
    rerender(<SearchInput value="" onSearch={vi.fn()} />)
    expect(screen.getByTestId('search-input-field')).toHaveValue('')
  })
})
