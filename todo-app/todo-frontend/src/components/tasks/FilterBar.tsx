import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CategoryDto } from '@/types/api'

type FilterUpdates = Record<string, string | string[] | null>

interface FilterBarProps {
  params: URLSearchParams
  onFilterChange: (updates: FilterUpdates) => void
  categories: CategoryDto[]
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
] as const

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'] as const

export function FilterBar({ params, onFilterChange, categories }: FilterBarProps) {
  const currentStatus = params.get('status') ?? 'all'
  const currentPriorities = params.getAll('priority')
  const currentCategoryIds = params.getAll('categoryIds')
  const dueDateFrom = params.get('dueDateFrom') ?? ''
  const dueDateTo = params.get('dueDateTo') ?? ''

  const togglePriority = (p: string) => {
    const next = currentPriorities.includes(p)
      ? currentPriorities.filter((x) => x !== p)
      : [...currentPriorities, p]
    onFilterChange({ priority: next.length ? next : null })
  }

  const toggleCategory = (id: string) => {
    const next = currentCategoryIds.includes(id)
      ? currentCategoryIds.filter((x) => x !== id)
      : [...currentCategoryIds, id]
    onFilterChange({ categoryIds: next.length ? next : null })
  }

  const handleDateFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ dueDateFrom: e.target.value || null })
  }

  const handleDateTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ dueDateTo: e.target.value || null })
  }

  return (
    <div
      className="flex flex-wrap items-end gap-4 rounded-xl border bg-gradient-to-r from-violet-50 to-indigo-50 p-4 shadow-sm"
      data-testid="filter-bar"
    >
      {/* Status */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              variant={currentStatus === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ status: value === 'all' ? null : value })}
              data-testid={`filter-status-${value}`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Priority</Label>
        <div className="flex gap-1">
          {PRIORITY_OPTIONS.map((p) => (
            <Button
              key={p}
              variant={currentPriorities.includes(p) ? 'default' : 'outline'}
              size="sm"
              onClick={() => togglePriority(p)}
              data-testid={`filter-priority-${p}`}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={currentCategoryIds.includes(cat.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleCategory(cat.id)}
                data-testid={`filter-category-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Date range */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Due date from</Label>
        <Input
          type="date"
          value={dueDateFrom}
          onChange={handleDateFrom}
          className="h-8 w-36 text-sm"
          data-testid="filter-date-from"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Due date to</Label>
        <Input
          type="date"
          value={dueDateTo}
          onChange={handleDateTo}
          className={cn('h-8 w-36 text-sm', dueDateFrom && dueDateTo && dueDateTo < dueDateFrom && 'border-destructive')}
          data-testid="filter-date-to"
        />
        {dueDateFrom && dueDateTo && dueDateTo < dueDateFrom && (
          <p className="text-xs text-destructive">To must be after From</p>
        )}
      </div>
    </div>
  )
}
