import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

interface ActiveFiltersBarProps {
  activeFilters: ActiveFilter[]
  onClearAll: () => void
}

export function ActiveFiltersBar({ activeFilters, onClearAll }: ActiveFiltersBarProps) {
  if (activeFilters.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="active-filters-bar"
    >
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm"
          data-testid={`active-filter-chip-${filter.key}`}
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="ml-1 rounded-full hover:text-destructive"
            aria-label={`Remove filter: ${filter.label}`}
            data-testid={`active-filter-remove-${filter.key}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-muted-foreground hover:text-foreground"
        data-testid="active-filters-clear-all"
      >
        Clear all
      </Button>
    </div>
  )
}
