import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { CategoryDto } from '@/types/api'

interface CategoryPickerProps {
  categories: CategoryDto[]
  value: string[]
  onChange: (ids: string[]) => void
  maxSelected?: number
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  maxSelected = 10,
}: CategoryPickerProps) {
  const isMaxReached = value.length >= maxSelected

  const handleToggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else if (!isMaxReached) {
      onChange([...value, id])
    }
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="category-picker-empty">
        No categories yet.{' '}
        <Link to="/categories" className="text-primary underline underline-offset-2">
          Create one first.
        </Link>
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="category-picker">
      {categories.map((cat) => {
        const selected = value.includes(cat.id)
        const disabled = isMaxReached && !selected
        return (
          <button
            key={cat.id}
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(cat.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              selected
                ? 'bg-primary text-primary-foreground border-primary'
                : disabled
                  ? 'cursor-not-allowed opacity-50 border-input'
                  : 'border-input hover:bg-muted cursor-pointer',
            )}
            data-testid={`category-chip-${cat.id}`}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
