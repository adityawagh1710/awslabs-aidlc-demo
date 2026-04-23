import { ArrowUp, ArrowDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'title', label: 'Title' },
]

export function SortControls() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortBy = searchParams.get('sortBy') ?? ''
  const sortOrder = searchParams.get('sortOrder') ?? 'asc'

  const handleSortBy = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (val) {
        next.set('sortBy', val)
        if (!next.get('sortOrder')) next.set('sortOrder', 'asc')
      } else {
        next.delete('sortBy')
        next.delete('sortOrder')
      }
      next.delete('page')
      return next
    })
  }

  const handleToggleOrder = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')
      next.delete('page')
      return next
    })
  }

  return (
    <div className="flex items-center gap-2" data-testid="sort-controls">
      <Select value={sortBy} onValueChange={handleSortBy}>
        <SelectTrigger className="w-40" data-testid="sort-by-select">
          <SelectValue placeholder="Sort by…" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        disabled={!sortBy}
        onClick={handleToggleOrder}
        aria-label="Sort direction"
        data-testid="sort-order-toggle"
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
