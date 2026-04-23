import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/store/api/categoriesApi'
import { useAppDispatch } from '@/store/hooks'
import { addToast } from '@/store/uiSlice'

const nameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or fewer'),
})
type NameValues = z.infer<typeof nameSchema>

export function CategoryManager() {
  const dispatch = useAppDispatch()
  const { data: categories = [], isLoading } = useGetCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
  })

  const handleCreate = async (values: NameValues) => {
    try {
      await createCategory({ name: values.name }).unwrap()
      reset()
      dispatch(addToast({ title: 'Category created' }))
    } catch {
      dispatch(addToast({ title: 'Failed to create category', variant: 'destructive' }))
    }
  }

  const handleRenameSubmit = async (id: string) => {
    try {
      await updateCategory({ id, name: editName }).unwrap()
      setEditingId(null)
      dispatch(addToast({ title: 'Category renamed' }))
    } catch {
      dispatch(addToast({ title: 'Failed to rename category', variant: 'destructive' }))
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteCategory(deletingId).unwrap()
      setDeletingId(null)
      dispatch(addToast({ title: 'Category deleted. Affected tasks untagged.' }))
    } catch {
      dispatch(addToast({ title: 'Failed to delete category', variant: 'destructive' }))
    }
  }

  const deletingCategory = categories.find((c) => c.id === deletingId)

  return (
    <div className="space-y-4" data-testid="category-manager">
      {/* Create form */}
      <form onSubmit={handleSubmit(handleCreate)} className="flex gap-2">
        <div className="flex-1">
          <Input
            {...register('name')}
            placeholder="New category name…"
            data-testid="category-manager-new-input"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? 'Adding…' : 'Add'}
        </Button>
      </form>

      {/* List */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground text-sm" data-testid="category-manager-empty">
          No categories yet.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between px-3 py-2"
              data-testid={`category-item-${cat.id}`}
            >
              {editingId === cat.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 flex-1"
                    autoFocus
                    data-testid={`category-item-rename-input-${cat.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRenameSubmit(cat.id)}
                    aria-label="Save"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    className="cursor-pointer text-sm hover:underline"
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                  >
                    {cat.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                      aria-label="Rename category"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(cat.id)}
                      className="text-destructive hover:text-destructive"
                      aria-label="Delete category"
                      data-testid={`category-item-delete-${cat.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        title={`Delete "${deletingCategory?.name ?? ''}"?`}
        message="Tasks with this category will lose the tag but won't be deleted."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
