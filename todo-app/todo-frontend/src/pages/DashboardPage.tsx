import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { SortControls } from '@/components/tasks/SortControls'
import { SearchInput } from '@/components/tasks/SearchInput'
import { FilterBar } from '@/components/tasks/FilterBar'
import { ActiveFiltersBar, type ActiveFilter } from '@/components/tasks/ActiveFiltersBar'
import { Pagination } from '@/components/shared/Pagination'
import { useGetTasksQuery, type TaskQueryArgs } from '@/store/api/tasksApi'
import { useGetCategoriesQuery } from '@/store/api/categoriesApi'
import type { CategoryDto } from '@/types/api'

function buildQueryArgs(
  params: URLSearchParams,
  sortBy: string | null,
  sortOrder: string,
): TaskQueryArgs {
  return {
    search: params.get('search') ?? undefined,
    status: (params.get('status') as TaskQueryArgs['status']) ?? undefined,
    priority: params.getAll('priority').length ? params.getAll('priority') : undefined,
    categoryIds: params.getAll('categoryIds').length ? params.getAll('categoryIds') : undefined,
    dueDateFrom: params.get('dueDateFrom') ?? undefined,
    dueDateTo: params.get('dueDateTo') ?? undefined,
    page: params.get('page') ? Number(params.get('page')) : 1,
    pageSize: 25,
    ...(sortBy ? { sortBy, sortOrder } : {}),
  }
}

// ── Derive active filter chips from URL params ─────────────────────────────────
function deriveActiveFilters(
  params: URLSearchParams,
  categories: CategoryDto[],
  setSearchParams: (fn: (prev: URLSearchParams) => URLSearchParams) => void,
): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  const removeParam = (key: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete(key)
      next.delete('page')
      return next
    })
  }

  const removeMultiParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const values = next.getAll(key).filter((v) => v !== value)
      next.delete(key)
      values.forEach((v) => next.append(key, v))
      next.delete('page')
      return next
    })
  }

  const search = params.get('search')
  if (search) {
    filters.push({ key: 'search', label: `Search: ${search}`, onRemove: () => removeParam('search') })
  }

  const status = params.get('status')
  if (status) {
    filters.push({
      key: 'status',
      label: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      onRemove: () => removeParam('status'),
    })
  }

  params.getAll('priority').forEach((p) => {
    filters.push({
      key: `priority-${p}`,
      label: `Priority: ${p}`,
      onRemove: () => removeMultiParam('priority', p),
    })
  })

  params.getAll('categoryIds').forEach((id) => {
    const cat = categories.find((c) => c.id === id)
    filters.push({
      key: `cat-${id}`,
      label: `Category: ${cat?.name ?? id}`,
      onRemove: () => removeMultiParam('categoryIds', id),
    })
  })

  const from = params.get('dueDateFrom')
  if (from) {
    filters.push({ key: 'dueDateFrom', label: `From: ${from}`, onRemove: () => removeParam('dueDateFrom') })
  }

  const to = params.get('dueDateTo')
  if (to) {
    filters.push({ key: 'dueDateTo', label: `To: ${to}`, onRemove: () => removeParam('dueDateTo') })
  }

  return filters
}

// ── Component ──────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder') ?? 'asc'

  const queryArgs = buildQueryArgs(searchParams, sortBy, sortOrder)
  const { data, isLoading } = useGetTasksQuery(queryArgs)
  const { data: categories = [] } = useGetCategoriesQuery()

  // Fetch all task titles for search suggestions (no filters, large page)
  const { data: allTasksData } = useGetTasksQuery({ pageSize: 200 })
  const suggestions = allTasksData?.items.map((t) => t.title) ?? []

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (query) next.set('search', query)
      else next.delete('search')
      next.delete('page')
      return next
    })
  }

  const handleFilterChange = (updates: Record<string, string | string[] | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(updates).forEach(([key, value]) => {
        next.delete(key)
        if (value !== null) {
          if (Array.isArray(value)) value.forEach((v) => next.append(key, v))
          else next.set(key, value)
        }
      })
      next.delete('page')
      return next
    })
  }

  const handleClearAll = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams()
      // Preserve sort params
      if (prev.get('sortBy')) next.set('sortBy', prev.get('sortBy')!)
      if (prev.get('sortOrder')) next.set('sortOrder', prev.get('sortOrder')!)
      return next
    })
  }

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(page))
      return next
    })
  }

  const activeFilters = deriveActiveFilters(searchParams, categories, setSearchParams)
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            My Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} task{data?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SortControls />
          <Button
            onClick={() => navigate('/tasks/new')}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
            data-testid="dashboard-new-task-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Search */}
      <SearchInput value={searchParams.get('search') ?? ''} onSearch={handleSearch} suggestions={suggestions} />

      {/* Filters */}
      <FilterBar
        params={searchParams}
        onFilterChange={handleFilterChange}
        categories={categories}
      />

      {/* Active filter chips */}
      {hasActiveFilters && (
        <ActiveFiltersBar activeFilters={activeFilters} onClearAll={handleClearAll} />
      )}

      {/* Task list */}
      <TaskList
        tasks={data?.items ?? []}
        isLoading={isLoading}
        queryArgs={queryArgs}
        onNewTask={() => navigate('/tasks/new')}
        emptyMessage={
          hasActiveFilters
            ? 'No tasks match the current filters.'
            : 'No tasks yet. Create your first task!'
        }
        showClearFilters={hasActiveFilters}
        onClearFilters={handleClearAll}
      />

      {/* Pagination */}
      <Pagination
        currentPage={data?.page ?? 1}
        totalPages={data?.totalPages ?? 1}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
