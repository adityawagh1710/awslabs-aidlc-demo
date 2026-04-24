import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { TaskForm } from '@/components/tasks/TaskForm'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useCreateTaskMutation, useUpdateTaskMutation, useGetTaskByIdQuery } from '@/store/api/tasksApi'
import { useAppDispatch } from '@/store/hooks'
import { addToast } from '@/store/uiSlice'
import type { CreateTaskRequest, UpdateTaskRequest } from '@/types/api'

interface TaskFormPageProps {
  mode: 'create' | 'edit'
}

export function TaskFormPage({ mode }: TaskFormPageProps) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { id } = useParams<{ id: string }>()

  const { data: existingTask, isLoading: isLoadingTask } = useGetTaskByIdQuery(id!, {
    skip: mode === 'create',
  })

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation()

  const isSubmitting = isCreating || isUpdating
  const backTo = mode === 'create' ? '/' : `/tasks/${id}`

  const handleSubmit = async (values: CreateTaskRequest | UpdateTaskRequest) => {
    try {
      if (mode === 'create') {
        await createTask(values as CreateTaskRequest).unwrap()
        dispatch(addToast({ title: 'Task created' }))
        navigate('/')
      } else {
        await updateTask({ id: id!, ...(values as UpdateTaskRequest) }).unwrap()
        dispatch(addToast({ title: 'Task updated' }))
        navigate(`/tasks/${id}`)
      }
    } catch {
      dispatch(addToast({
        title: mode === 'create' ? 'Failed to create task' : 'Failed to update task',
        variant: 'destructive',
      }))
    }
  }

  if (mode === 'edit' && isLoadingTask) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6" data-testid="task-form-page">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold gradient-text mb-6">
          {mode === 'create' ? '✨ New Task' : '✏️ Edit Task'}
        </h1>
        <TaskForm
          mode={mode}
          initialValues={existingTask}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
