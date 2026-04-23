# Business Logic Model — UNIT-07: Frontend Search, Filter & Pagination UI

## State Architecture

URL query params are the single source of truth for all search/filter/page state (Q1:A).
Sort state (sortBy, sortOrder) remains in Redux from UNIT-05.
`DashboardPage` reads both and merges them into `useGetTasksQuery` args.

```
URL: /tasks?search=buy&status=active&priority=High&page=2
Redux: { ui: { sortBy: 'dueDate', sortOrder: 'asc' } }
          ↓                              ↓
        useSearchParams             useAppSelector
                    \               /
                DashboardPage
                    ↓
          useGetTasksQuery({ search, status, priority, categoryIds,
                             dueDateFrom, dueDateTo, page, pageSize,
                             sortBy, sortOrder })
```

---

## Flow 1: Search Submit (Q2:C — Enter OR Search button)

```
User types in SearchInput
    │  local state: inputValue (uncontrolled until submit)
    │
    ├── Press Enter key → handleSubmit()
    └── Click "Search" button → handleSubmit()
    │
    ▼
handleSubmit():
    - If inputValue.trim() === '' → delete 'search' param, set page=1
    - Else → set search=inputValue.trim(), set page=1
    ▼
setSearchParams({ ...current, search: value, page: '1' })
    │
    ▼
URL updates → DashboardPage re-reads → useGetTasksQuery refetches
```

---

## Flow 2: Filter Change (FilterBar — always visible, Q3:A)

```
User changes status / priority / category / date range in FilterBar
    │
    ▼
FilterBar calls onFilterChange(key, value)
    │
    ▼
DashboardPage: setSearchParams — updates the specific param, resets page to 1
    │  e.g. status=active, page=1
    ▼
URL updates → useGetTasksQuery refetches with new filters
```

---

## Flow 3: Clear Individual Filter (Active Filters Chip, Q4:C)

```
User clicks × on "Status: Active" chip in ActiveFiltersBar
    │
    ▼
Remove 'status' from URL params; reset page=1
    ▼
URL: /tasks (status param removed) → query re-runs without status filter
```

---

## Flow 4: Clear All Filters (Q4:C)

```
User clicks "Clear all" in ActiveFiltersBar
    │
    ▼
Remove ALL filter/search params from URL:
  delete: search, status, priority, categoryIds, dueDateFrom, dueDateTo, page
  preserve: sortBy, sortOrder (sort is user preference, not a filter)
    ▼
URL resets to /tasks (or /tasks?sortBy=dueDate&sortOrder=asc if sort active)
    ▼
useGetTasksQuery refetches with no filters — returns all tasks
```

---

## Flow 5: Pagination (full, Q1:A)

```
User clicks "Next" / "Previous" / page number in Pagination component
    │
    ▼
setSearchParams({ ...current, page: String(newPage) })
    │
    ▼
URL updates → useGetTasksQuery refetches with new page
    │
    Note: changing page does NOT reset other filter params (they are preserved in URL)
```

---

## Flow 6: Page Load / Refresh — URL Restoration

```
User navigates to /tasks?search=urgent&status=active&page=2
    │
    ▼
DashboardPage mounts → useSearchParams reads all params from URL
    │
    ▼
useGetTasksQuery called with restored filter state
    │
    ▼
FilterBar, SearchInput, ActiveFiltersBar all initialise from URL params
    │  SearchInput: inputValue = url.get('search') ?? ''
    │  FilterBar: reads status/priority/categoryIds/dates from URL
    │  ActiveFiltersBar: derives active filters from URL
    ▼
User sees the same filtered state they left (or bookmarked/shared)
```

---

## Flow 7: No-Results Empty State

```
useGetTasksQuery returns { items: [], total: 0 }
    │
    ├── Active filters exist:
    │     → "No tasks match the current filters."
    │       + "Clear filters" button
    │
    └── No active filters:
          → "No tasks yet. Create your first task!"
            + "New Task" button
```
