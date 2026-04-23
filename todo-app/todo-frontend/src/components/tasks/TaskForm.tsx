import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryPicker } from '@/components/tasks/CategoryPicker'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import type { TaskDto, CreateTaskRequest, UpdateTaskRequest } from '@/types/api'

const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or fewer'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || new Date(val) >= today(),
      'Due date must be today or in the future',
    ),
  categoryIds: z.array(z.string()).max(10).default([]),
})

type TaskFormValues = z.infer<typeof taskSchema>

interface TaskFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<TaskDto>
  onSubmit: (values: CreateTaskRequest | UpdateTaskRequest) => Promise<void>
  isSubmitting: boolean
}

export function TaskForm({ mode, initialValues, onSubmit, isSubmitting }: TaskFormProps) {
  const { data: categories = [] } = useGetCategoriesQuery()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      priority: initialValues?.priority ?? 'Medium',
      dueDate: initialValues?.dueDate ?? '',
      categoryIds: initialValues?.categories?.map((c) => c.id) ?? [],
    },
  })

  const handleFormSubmit = async (values: TaskFormValues) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    await onSubmit({
      ...values,
      ...(values.dueDate ? { timezone } : {}),
      description: values.description || undefined,
      dueDate: values.dueDate || undefined,
    })
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
      data-testid="task-form"
    >
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="What needs to be done?"
          data-testid="task-form-title"
        />
        {errors.title && (
          <p className="text-sm text-destructive" role="alert">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Add more details…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          data-testid="task-form-description"
        />
        {errors.description && (
          <p className="text-sm text-destructive" role="alert">{errors.description.message}</p>
        )}
      </div>

      {/* Priority */}
      <div className="space-y-1">
        <Label htmlFor="priority">Priority</Label>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="priority" data-testid="task-form-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Due date */}
      <div className="space-y-1">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          min={new Date().toISOString().split('T')[0]}
          {...register('dueDate')}
          data-testid="task-form-due-date"
        />
        {errors.dueDate && (
          <p className="text-sm text-destructive" role="alert">{errors.dueDate.message}</p>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-1">
        <Label>Categories</Label>
        <Controller
          name="categoryIds"
          control={control}
          render={({ field }) => (
            <CategoryPicker
              categories={categories}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.categoryIds && (
          <p className="text-sm text-destructive" role="alert">
            {errors.categoryIds.message as string}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} data-testid="task-form-submit">
        {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Task' : 'Save Changes'}
      </Button>
    </form>
  )
}
