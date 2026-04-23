import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/renderWithProviders'
import { SearchInput } from '@/components/tasks/SearchInput'

describe('SearchInput', () => {
  it('renders input and search button', () => {
    renderWithProviders(<SearchInput value="" onSearch={vi.fn()} />)
    expect(screen.getByTestId('search-input-field')).toBeInTheDocument()
    expect(screen.getByTestId('search-input-button')).toBeInTheDocument()
  })

  it('calls onSearch with trimmed value on button click', async () => {
    const onSearch = vi.fn()
    renderWithProviders(<SearchInput value="" onSearch={onSearch} />)
    await userEvent.type(screen.getByTestId('search-input-field'), '  buy milk  ')
    await userEvent.click(screen.getByTestId('search-input-button'))
    expect(onSearch).toHaveBeenCalledWith('buy milk')
  })

  it('calls onSearch on Enter key press', async () => {
    const onSearch = vi.fn()
    renderWithProviders(<SearchInput value="" onSearch={onSearch} />)
    await userEvent.type(screen.getByTestId('search-input-field'), 'urgent{Enter}')
    expect(onSearch).toHaveBeenCalledWith('urgent')
  })

  it('calls onSearch with empty string when submitted empty', async () => {
    const onSearch = vi.fn()
    renderWithProviders(<SearchInput value="previous" onSearch={onSearch} />)
    const input = screen.getByTestId('search-input-field')
    await userEvent.clear(input)
    await userEvent.click(screen.getByTestId('search-input-button'))
    expect(onSearch).toHaveBeenCalledWith('')
  })

  it('syncs local state when value prop changes', () => {
    const { rerender } = renderWithProviders(<SearchInput value="old" onSearch={vi.fn()} />)
    expect(screen.getByTestId('search-input-field')).toHaveValue('old')
    rerender(<SearchInput value="" onSearch={vi.fn()} />)
    expect(screen.getByTestId('search-input-field')).toHaveValue('')
  })
})
