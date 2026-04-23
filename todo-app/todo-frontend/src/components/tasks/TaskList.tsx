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
  return (
    <div data-testid="task-list">
      <table className="w-full text-sm" data-testid="task-list-table">
        <caption className="sr-only">My Tasks</caption>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th scope="col" className="w-8 py-2" />
            <th scope="col" className="py-2 pr-4">Title</th>
            <th scope="col" className="py-2 pr-4 hidden sm:table-cell">Priority</th>
            <th scope="col" className="py-2 pr-4 hidden md:table-cell">Due Date</th>
            <th scope="col" className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="py-8 text-center">
                <LoadingSpinner />
              </td>
            </tr>
          ) : tasks.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-muted-foreground">
                <p className="mb-2" data-testid="task-list-empty-message">
                  {emptyMessage ?? 'No tasks yet.'}
                </p>
                {showClearFilters ? (
                  <button
                    onClick={onClearFilters}
                    className="text-primary underline underline-offset-2"
                    data-testid="task-list-empty-clear-filters"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    onClick={onNewTask}
                    className="text-primary underline underline-offset-2"
                    data-testid="task-list-empty-create"
                  >
                    Create your first task!
                  </button>
                )}
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <TaskRow key={task.id} task={task} queryArgs={queryArgs} />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
