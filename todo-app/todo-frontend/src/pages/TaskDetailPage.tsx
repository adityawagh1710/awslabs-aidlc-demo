import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useGetTaskByIdQuery, useDeleteTaskMutation, useToggleTaskMutation } from '@/store/api/tasksApi'
import { useAppDispatch } from '@/store/hooks'
import { addToast } from '@/store/uiSlice'
import { cn } from '@/lib/utils'

const PRIORITY_CLASSES: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-red-100 text-red-700',
}

export function TaskDetailPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { id } = useParams<{ id: string }>()
  const [showDelete, setShowDelete] = useState(false)

  const { data: task, isLoading, error } = useGetTaskByIdQuery(id!)
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation()
  const [toggleTask] = useToggleTaskMutation()

  // Pattern 28: 403/404 guard
  useEffect(() => {
    if (!error) return
    const status = (error as FetchBaseQueryError).status
    if (status === 404) dispatch(addToast({ title: 'Task not found', variant: 'destructive' }))
    else if (status === 403) dispatch(addToast({ title: 'Access denied', variant: 'destructive' }))
    else dispatch(addToast({ title: 'Failed to load task', variant: 'destructive' }))
    navigate('/')
  }, [error, navigate, dispatch])

  const handleDelete = async () => {
    await deleteTask({ id: id!, queryArgs: {} })
    setShowDelete(false)
    navigate('/')
  }

  const handleToggle = () => toggleTask({ id: id!, queryArgs: {} })

  if (isLoading || !task) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6" data-testid="task-detail-page">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/tasks/${id}/edit`)}
            data-testid="task-detail-edit-button"
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDelete(true)}
            data-testid="task-detail-delete-button"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className={cn('text-xl font-semibold', task.completed && 'line-through text-muted-foreground')}>
            {task.title}
          </h1>
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_CLASSES[task.priority])}>
              {task.priority}
            </span>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={handleToggle}
              aria-label={`Mark as ${task.completed ? 'incomplete' : 'complete'}`}
              className="h-4 w-4 cursor-pointer"
            />
          </div>
        </div>

        {task.description && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Due Date</dt>
            <dd className={cn(task.isOverdue && 'text-red-600 font-medium')}>
              {task.dueDate
                ? `${new Date(task.dueDate).toLocaleDateString()}${task.isOverdue ? ' (Overdue)' : ''}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{task.completed ? 'Complete' : 'Active'}</dd>
          </div>
          {task.completedAt && (
            <div>
              <dt className="text-muted-foreground">Completed at</dt>
              <dd>{new Date(task.completedAt).toLocaleString()}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(task.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd>{new Date(task.updatedAt).toLocaleDateString()}</dd>
          </div>
        </dl>

        {task.categories.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm text-muted-foreground">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {task.categories.map((c) => (
                <span key={c.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete task?"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
