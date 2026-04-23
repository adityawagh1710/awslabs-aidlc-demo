# Logical Components — UNIT-07: Frontend Search, Filter & Pagination UI

## File Summary

```
src/
├── store/api/
│   └── tasksApi.ts              ← MODIFIED: extend TaskQueryArgs + getTasks URL builder
├── pages/
│   └── DashboardPage.tsx        ← MODIFIED: URL state, FilterBar, SearchInput, ActiveFiltersBar
├── components/tasks/
│   ├── SearchInput.tsx          ← NEW
│   ├── FilterBar.tsx            ← NEW
│   ├── ActiveFiltersBar.tsx     ← NEW
│   └── TaskRow.tsx              ← MODIFIED: receive URL-based queryArgs from parent
├── components/shared/
│   └── Pagination.tsx           ← MODIFIED: functional onPageChange
tests/
├── component/
│   ├── SearchInput.test.tsx     ← NEW
│   ├── FilterBar.test.tsx       ← NEW
│   ├── ActiveFiltersBar.test.tsx ← NEW
│   └── DashboardPage.test.tsx   ← MODIFIED: add filter/search scenarios
└── property/
    └── url-filters.property.test.ts ← NEW: PBT-UI-01 through PBT-UI-04
```

---

## Component Responsibilities

### `tasksApi` (TaskQueryArgs extended)
- `TaskQueryArgs` gains: `search?`, `status?`, `priority?[]`, `categoryIds?[]`, `dueDateFrom?`, `dueDateTo?`, `page?`, `pageSize?`
- `getTasks` URL builder updated to serialize all new params (multi-value via repeated `key=val`)
- Cache tags unaffected — same `['Task', 'LIST']` tag strategy

### `DashboardPage` (major update — Pattern 34)
- Reads all filter state from `useSearchParams()`
- Reads sort state from `useAppSelector(selectSortBy/selectSortOrder)`
- Calls `buildQueryArgs(searchParams, sortBy, sortOrder)` → `useGetTasksQuery(args)`
- Passes `queryArgs` down to `TaskList` → `TaskRow` (for optimistic mutation cache keys)
- Renders: `SearchInput` + `FilterBar` + `ActiveFiltersBar` + `SortControls` + `TaskList` + `Pagination`
- `handleFilterChange` calls `setSearchParams` and resets `page=1`
- Empty state: context-aware (BR-U-16)

### `SearchInput` (Pattern 35)
- Local `inputValue` state — no URL writes on keystroke
- `useEffect` syncs from URL when URL changes externally (Clear all)
- Submits via Enter key or "Search" button
- Empty submit removes `search` URL param

### `FilterBar`
- Status: three `<Button variant="outline">` toggles reading `params.get('status')`
- Priority: chip toggles reading `params.getAll('priority')`
- Categories: chip toggles from `useGetCategoriesQuery()`, reading `params.getAll('categoryIds')`
- Date range: two `<Input type="date">` with client-side `from < to` validation
- All changes call `handleFilterChange` from DashboardPage

### `ActiveFiltersBar` (Pattern 37)
- Pure presentational component: `{ activeFilters: ActiveFilter[], onClearAll }`
- `activeFilters` derived in DashboardPage via `deriveActiveFilters()`
- Renders nothing when `activeFilters.length === 0`
- Each chip: `<span>{label}</span><button aria-label="Remove ..." onClick={onRemove}>×</button>`
- "Clear all" removes all filter/search/page params, preserves sort

### `Pagination` (functional)
- Before: `onPageChange={() => {}}` noop
- After: receives `onPageChange` from DashboardPage that calls `setSearchParams`
- `currentPage` passed as `Number(searchParams.get('page')) || 1`

### `TaskRow` (queryArgs update)
- Before: `queryArgs = {}` hardcoded (caused optimistic mutations to patch wrong cache key)
- After: receives `queryArgs: TaskQueryArgs` from DashboardPage via TaskList
- Ensures `deleteTask` and `toggleTask` optimistic patches hit the correct RTK Query cache entry

---

## Data Flow — DashboardPage with Filters

```
URL: /tasks?search=urgent&status=active&priority=High&page=1
Redux: { ui: { sortBy: 'dueDate', sortOrder: 'asc' } }
    │
    ▼
DashboardPage
    ├── buildQueryArgs(searchParams, sortBy, sortOrder)
    │     → { search: 'urgent', status: 'active', priority: ['High'],
    │         page: 1, pageSize: 25, sortBy: 'dueDate', sortOrder: 'asc' }
    ├── useGetTasksQuery(queryArgs)
    │     → GET /api/v1/tasks?search=urgent&status=active&priority=High&page=1&pageSize=25&sortBy=dueDate&sortOrder=asc
    │
    ├── SearchInput (value='urgent', synced from URL)
    ├── FilterBar (status=active, priority=High chips filled)
    ├── ActiveFiltersBar
    │     chips: ['Search: "urgent"', 'Status: Active', 'Priority: High']
    │     + "Clear all" button
    ├── SortControls (sortBy=dueDate from Redux)
    ├── TaskList → TaskRow × N (queryArgs passed down)
    └── Pagination (currentPage=1, totalPages from query response)
```
