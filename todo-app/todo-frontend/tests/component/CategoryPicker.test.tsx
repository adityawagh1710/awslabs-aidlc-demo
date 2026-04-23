import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../utils/renderWithProviders'

import { CategoryPicker } from '@/components/tasks/CategoryPicker'
import type { CategoryDto } from '@/types/api'

const cats: CategoryDto[] = [
  { id: 'c1', name: 'Work', createdAt: '', updatedAt: '' },
  { id: 'c2', name: 'Personal', createdAt: '', updatedAt: '' },
  { id: 'c3', name: 'Shopping', createdAt: '', updatedAt: '' },
]

describe('CategoryPicker', () => {
  it('renders empty state when no categories', () => {
    renderWithProviders(
      <CategoryPicker categories={[]} value={[]} onChange={vi.fn()} />
    )
    expect(screen.getByTestId('category-picker-empty')).toBeInTheDocument()
  })

  it('renders chips for each category', () => {
    renderWithProviders(
      <CategoryPicker categories={cats} value={[]} onChange={vi.fn()} />
    )
    expect(screen.getByTestId('category-chip-c1')).toBeInTheDocument()
    expect(screen.getByTestId('category-chip-c2')).toBeInTheDocument()
  })

  it('calls onChange with selected id when chip clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <CategoryPicker categories={cats} value={[]} onChange={onChange} />
    )
    await user.click(screen.getByTestId('category-chip-c1'))
    expect(onChange).toHaveBeenCalledWith(['c1'])
  })

  it('deselects chip when already selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <CategoryPicker categories={cats} value={['c1']} onChange={onChange} />
    )
    await user.click(screen.getByTestId('category-chip-c1'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('disables unselected chips when max (10) reached', () => {
    const tenCats: CategoryDto[] = Array.from({ length: 11 }, (_, i) => ({
      id: `c${i}`, name: `Cat${i}`, createdAt: '', updatedAt: '',
    }))
    const selectedIds = tenCats.slice(0, 10).map((c) => c.id)
    renderWithProviders(
      <CategoryPicker categories={tenCats} value={selectedIds} onChange={vi.fn()} />
    )
    const lastChip = screen.getByTestId(`category-chip-c10`) as HTMLButtonElement
    expect(lastChip.disabled).toBe(true)
  })
})
