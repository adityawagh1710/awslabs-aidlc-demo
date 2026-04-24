import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TaskRow } from '@/components/tasks/TaskRow'
import type { TaskDto } from '@/types/api'
import type { TaskQueryArgs } from '@/store/api/tasksApi'

interface TaskListProps {
  tasks: TaskDto[]
  isLoading: boolean
  queryArgs: TaskQueryArgs
  onNewTask: () => void
  emptyMessage?: string
  showClearFilters?: boolean
  onClearFilters?: () => void
}

export function TaskList({
  tasks,
  isLoading,
  queryArgs,
  onNewTask,
  emptyMessage,
  showClearFilters,
  onClearFilters,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16" data-testid="task-list">
        <LoadingSpinner />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/60 py-16 text-center" data-testid="task-list">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-muted-foreground text-sm mb-3" data-testid="task-list-empty-message">
          {emptyMessage ?? 'No tasks yet.'}
        </p>
        {showClearFilters ? (
          <button
            onClick={onClearFilters}
            className="text-sm text-violet-600 hover:text-violet-700 underline underline-offset-2"
            data-testid="task-list-empty-clear-filters"
          >
            Clear filters
          </button>
        ) : (
          <button
            onClick={onNewTask}
            className="text-sm text-violet-600 hover:text-violet-700 underline underline-offset-2"
            data-testid="task-list-empty-create"
          >
            Create your first task!
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2" data-testid="task-list">
      {/* Accessible table caption for screen readers */}
      <span className="sr-only">Task list</span>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} queryArgs={queryArgs} />
      ))}
    </div>
  )
}
