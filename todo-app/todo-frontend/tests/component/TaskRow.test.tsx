import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../utils/renderWithProviders'

import { TaskRow } from '@/components/tasks/TaskRow'
import type { TaskDto } from '@/types/api'

function makeTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: 'task-1',
    title: 'Buy groceries',
    description: null,
    priority: 'Medium',
    dueDate: null,
    completed: false,
    completedAt: null,
    isOverdue: false,
    categories: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

const queryArgs = {}

describe('TaskRow', () => {
  it('renders task title as a link', () => {
    renderWithProviders(
      <table><tbody><TaskRow task={makeTask()} queryArgs={queryArgs} /></tbody></table>
    )
    expect(screen.getByTestId('task-row-title-task-1')).toBeInTheDocument()
  })

  it('applies overdue rose styling when isOverdue=true', () => {
    renderWithProviders(
      <table><tbody><TaskRow task={makeTask({ isOverdue: true })} queryArgs={queryArgs} /></tbody></table>
    )
    const row = screen.getByTestId('task-row-task-1')
    expect(row.className).toMatch(/border-rose-200/)
  })

  it('does NOT apply overdue styling when isOverdue=false', () => {
    renderWithProviders(
      <table><tbody><TaskRow task={makeTask({ isOverdue: false })} queryArgs={queryArgs} /></tbody></table>
    )
    const row = screen.getByTestId('task-row-task-1')
    expect(row.className).not.toMatch(/border-rose-200/)
  })

  it('applies line-through to completed task title', () => {
    renderWithProviders(
      <table><tbody><TaskRow task={makeTask({ completed: true })} queryArgs={queryArgs} /></tbody></table>
    )
    const title = screen.getByTestId('task-row-title-task-1')
    expect(title.className).toMatch(/line-through/)
  })

  it('shows delete confirm dialog when delete button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <table><tbody><TaskRow task={makeTask()} queryArgs={queryArgs} /></tbody></table>
    )
    await user.click(screen.getByTestId('task-row-delete-task-1'))
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
  })

  it('checkbox is checked when task is completed', () => {
    renderWithProviders(
      <table><tbody><TaskRow task={makeTask({ completed: true })} queryArgs={queryArgs} /></tbody></table>
    )
    const checkbox = screen.getByTestId('task-row-toggle-task-1') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })
})
