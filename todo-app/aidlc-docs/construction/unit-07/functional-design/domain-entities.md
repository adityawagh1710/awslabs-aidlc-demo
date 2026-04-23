# Domain Entities — UNIT-07: Frontend Search, Filter & Pagination UI

## Extended `TaskQueryArgs` (src/store/api/tasksApi.ts)

```typescript
// BEFORE (UNIT-05):
export interface TaskQueryArgs {
  sortBy?: string
  sortOrder?: string
}

// AFTER (UNIT-07):
export interface TaskQueryArgs {
  sortBy?: string
  sortOrder?: string
  search?: string
  status?: 'active' | 'completed' | 'all'
  priority?: string[]
  categoryIds?: string[]
  dueDateFrom?: string    // YYYY-MM-DD
  dueDateTo?: string      // YYYY-MM-DD
  page?: number
  pageSize?: number
}
```

---

## URL Parameter Schema

```
/tasks
  ?search=<string>
  &status=active|completed|all
  &priority=Low&priority=High        (multi-value)
  &categoryIds=cat1&categoryIds=cat2 (multi-value)
  &dueDateFrom=YYYY-MM-DD
  &dueDateTo=YYYY-MM-DD
  &page=<integer>
  &sortBy=dueDate|priority|createdAt|title
  &sortOrder=asc|desc
```

---

## URL ↔ Query Args Mapping (DashboardPage)

```typescript
function buildQueryArgs(
  params: URLSearchParams,
  sortBy: SortBy,
  sortOrder: SortOrder,
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
```

---

## Active Filters Derived State

```typescript
interface ActiveFilter {
  key: string          // e.g. 'search', 'status', 'priority', 'cat-<id>'
  label: string        // e.g. 'Search: urgent', 'Status: Active'
  onRemove: () => void // removes this specific filter from URL
}

// Derived in DashboardPage or ActiveFiltersBar from URLSearchParams
function deriveActiveFilters(
  params: URLSearchParams,
  categories: CategoryDto[],
  setSearchParams: SetURLSearchParams,
): ActiveFilter[]
```

---

## New / Modified Components

| Component | File | Status |
|---|---|---|
| `SearchInput` | `src/components/tasks/SearchInput.tsx` | NEW |
| `FilterBar` | `src/components/tasks/FilterBar.tsx` | NEW |
| `ActiveFiltersBar` | `src/components/tasks/ActiveFiltersBar.tsx` | NEW |
| `DashboardPage` | `src/pages/DashboardPage.tsx` | MODIFIED — wire URL params |
| `Pagination` | `src/components/shared/Pagination.tsx` | MODIFIED — functional page change |
| `tasksApi` | `src/store/api/tasksApi.ts` | MODIFIED — extend TaskQueryArgs |
| `TaskRow` | `src/components/tasks/TaskRow.tsx` | MODIFIED — pass URL-based queryArgs to mutations |
