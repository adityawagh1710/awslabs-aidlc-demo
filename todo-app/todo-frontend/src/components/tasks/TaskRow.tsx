import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToggleTaskMutation, useDeleteTaskMutation } from '@/store/api/tasksApi'
import type { TaskDto } from '@/types/api'
import type { TaskQueryArgs } from '@/store/api/tasksApi'

const PRIORITY_CLASSES: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  High: 'bg-rose-100 text-rose-700 border border-rose-200',
}

interface TaskRowProps {
  task: TaskDto
  queryArgs: TaskQueryArgs
}

export function TaskRow({ task, queryArgs }: TaskRowProps) {
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [toggleTask] = useToggleTaskMutation()
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation()

  const handleToggle = () => toggleTask({ id: task.id, queryArgs })

  const handleDelete = async () => {
    await deleteTask({ id: task.id, queryArgs })
    setShowDelete(false)
  }

  return (
    <>
      <tr
        className={cn(
          'border-b transition-colors hover:bg-muted/40',
          task.isOverdue && 'border-l-4 border-l-red-500',
        )}
        data-testid={`task-row-${task.id}`}
      >
        {/* Completion toggle */}
        <td className="py-3 pr-2">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
            className="h-4 w-4 cursor-pointer rounded border-gray-300"
            data-testid={`task-row-toggle-${task.id}`}
          />
        </td>

        {/* Title */}
        <td className="py-3 pr-4">
          <Link
            to={`/tasks/${task.id}`}
            className={cn(
              'font-medium hover:underline',
              task.completed && 'line-through text-muted-foreground',
            )}
            data-testid={`task-row-title-${task.id}`}
          >
            {task.title}
          </Link>
          {task.categories.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {task.categories.map((c) => (
                <span key={c.id} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </td>

        {/* Priority */}
        <td className="py-3 pr-4 hidden sm:table-cell">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_CLASSES[task.priority])}>
            {task.priority}
          </span>
        </td>

        {/* Due date */}
        <td className="py-3 pr-4 hidden md:table-cell">
          {task.dueDate ? (
            <span className={cn('text-sm', task.isOverdue && 'text-red-600 font-medium')}>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/tasks/${task.id}/edit`)}
              aria-label="Edit task"
              data-testid={`task-row-edit-${task.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(true)}
              aria-label="Delete task"
              className="text-destructive hover:text-destructive"
              data-testid={`task-row-delete-${task.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete task?"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}
