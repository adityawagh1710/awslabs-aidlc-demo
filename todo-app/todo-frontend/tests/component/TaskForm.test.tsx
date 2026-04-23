import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '../utils/renderWithProviders'

import { TaskForm } from '@/components/tasks/TaskForm'

describe('TaskForm', () => {
  it('shows required error when title is empty on submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithProviders(
      <TaskForm mode="create" onSubmit={onSubmit} isSubmitting={false} />
    )
    await user.click(screen.getByTestId('task-form-submit'))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Title is required')
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with form values when valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(
      <TaskForm mode="create" onSubmit={onSubmit} isSubmitting={false} />
    )
    await user.type(screen.getByTestId('task-form-title'), 'Buy milk')
    await user.click(screen.getByTestId('task-form-submit'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Buy milk', priority: 'Medium' })
    )
  })

  it('pre-populates fields in edit mode', () => {
    renderWithProviders(
      <TaskForm
        mode="edit"
        initialValues={{ title: 'Existing task', priority: 'High' }}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />
    )
    expect(screen.getByTestId('task-form-title')).toHaveValue('Existing task')
  })

  it('shows max-length error for title > 255 chars', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TaskForm mode="create" onSubmit={vi.fn()} isSubmitting={false} />
    )
    await user.type(screen.getByTestId('task-form-title'), 'a'.repeat(256))
    await user.click(screen.getByTestId('task-form-submit'))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('255 characters')
    })
  })
})
