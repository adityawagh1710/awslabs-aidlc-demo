import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToggleTaskMutation, useDeleteTaskMutation } from '@/store/api/tasksApi'
import type { TaskDto } from '@/types/api'
import type { TaskQueryArgs } from '@/store/api/tasksApi'

const PRIORITY_CONFIG: Record<string, { classes: string; dot: string }> = {
  Low:    { classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  Medium: { classes: 'bg-amber-50 text-amber-700 border border-amber-200',       dot: 'bg-amber-500' },
  High:   { classes: 'bg-rose-50 text-rose-700 border border-rose-200',          dot: 'bg-rose-500' },
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

  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.Medium

  return (
    <>
      <div
        className={cn(
          'group relative flex items-start gap-3 rounded-xl border bg-white p-4 card-hover fade-in',
          task.completed ? 'opacity-60' : '',
          task.isOverdue && !task.completed ? 'border-rose-200 bg-rose-50/30' : 'border-border',
        )}
        data-testid={`task-row-${task.id}`}
      >
        {/* Priority stripe */}
        <div className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-full', priority.dot)} />

        {/* Checkbox */}
        <div className="mt-0.5 ml-2 flex-shrink-0">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-violet-600"
            data-testid={`task-row-toggle-${task.id}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/tasks/${task.id}`}
              className={cn(
                'font-medium text-sm leading-snug hover:text-violet-600 transition-colors',
                task.completed && 'line-through text-muted-foreground',
              )}
              data-testid={`task-row-title-${task.id}`}
            >
              {task.title}
            </Link>

            {/* Actions — visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/tasks/${task.id}/edit`)}
                aria-label="Edit task"
                className="h-7 w-7 p-0 hover:bg-violet-50 hover:text-violet-600"
                data-testid={`task-row-edit-${task.id}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(true)}
                aria-label="Delete task"
                className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600"
                data-testid={`task-row-delete-${task.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', priority.classes)}>
              {task.priority}
            </span>

            {task.dueDate && (
              <span className={cn(
                'flex items-center gap-1 text-xs',
                task.isOverdue && !task.completed ? 'text-rose-600 font-medium' : 'text-muted-foreground',
              )}>
                {task.isOverdue && !task.completed
                  ? <AlertCircle className="h-3 w-3" />
                  : <Calendar className="h-3 w-3" />}
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}

            {task.categories.map((c) => (
              <span key={c.id} className="rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-xs text-violet-600">
                {c.name}
              </span>
            ))}
          </div>
        </div>
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
    </>
  )
}
