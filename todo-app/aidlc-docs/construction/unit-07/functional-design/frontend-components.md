# Frontend Components — UNIT-07: Frontend Search, Filter & Pagination UI

## Updated Component Hierarchy

```
DashboardPage (modified)
  ├── <SearchInput>              ← NEW — input + Enter/button submit
  ├── <FilterBar>                ← NEW — always-visible filter controls
  │     ├── Status toggles (All/Active/Completed)
  │     ├── Priority chips (Low/Medium/High)
  │     ├── Category chips (from useGetCategoriesQuery)
  │     └── Date range inputs (from/to)
  ├── <ActiveFiltersBar>         ← NEW — chips + clear all (conditional)
  ├── <SortControls>             ← existing (UNIT-05, unchanged)
  ├── <TaskList>                 ← existing (UNIT-05); receives updated queryArgs
  │     └── <TaskRow> × N       ← modified: receives URL-based queryArgs
  └── <Pagination>               ← existing, now functional (wired to URL)
```

---

## New Components

### `SearchInput`

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/SearchInput.tsx` |
| **Props** | `{ value: string; onSearch: (query: string) => void }` |
| **Renders** | Text input + "Search" button |
| **Behavior** | Local state for input value; submits on Enter key or button click (Q2:C) |
| **Clear** | If submitted with empty value → calls `onSearch('')` |
| **data-testid** | `search-input`, `search-input-field`, `search-input-button` |

### `FilterBar`

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/FilterBar.tsx` |
| **Props** | `{ params: URLSearchParams; onFilterChange: (updates: Record<string, string \| string[] \| null>) => void; categories: CategoryDto[] }` |
| **Renders** | Inline row of filter controls (always visible — Q3:A) |
| **Status** | Three `<Button variant="outline">` toggles: All / Active / Completed |
| **Priority** | Three toggle chips: Low / Medium / High (multi-select) |
| **Category** | Category chips from user's categories (multi-select) |
| **Date range** | Two `<Input type="date">` fields: "From" and "To" with client-side validation |
| **data-testid** | `filter-bar`, `filter-status-all`, `filter-status-active`, `filter-status-completed`, `filter-priority-Low`, `filter-priority-Medium`, `filter-priority-High`, `filter-date-from`, `filter-date-to` |

### `ActiveFiltersBar`

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/ActiveFiltersBar.tsx` |
| **Props** | `{ activeFilters: ActiveFilter[]; onClearAll: () => void }` |
| **Renders** | Nothing if `activeFilters.length === 0`; chips + "Clear all" button otherwise |
| **Chips** | One chip per active filter with label and × remove button (Q4:C) |
| **Clear all** | Removes all filter/search/page params from URL, preserves sort |
| **data-testid** | `active-filters-bar`, `active-filter-chip-<key>`, `active-filters-clear-all` |

---

## Modified Components

### `DashboardPage` (major update)

**Before**: uses `useAppSelector(selectSortBy/selectSortOrder)` + simple `useGetTasksQuery`

**After**:
- `const [searchParams, setSearchParams] = useSearchParams()` — URL as filter source of truth
- `buildQueryArgs(searchParams, sortBy, sortOrder)` → `useGetTasksQuery(queryArgs)`
- Renders: SearchInput + FilterBar + ActiveFiltersBar + SortControls + TaskList + Pagination
- `deriveActiveFilters(searchParams, categories, setSearchParams)` → ActiveFiltersBar
- Empty state logic: context-aware based on whether filters are active (BR-U-16)

### `Pagination` (fully functional)

**Before**: `onPageChange={() => {}}` noop in DashboardPage  
**After**: `onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: String(p) })}`

### `TaskRow` (queryArgs update)

**Before**: `queryArgs = {}` hardcoded  
**After**: receives `queryArgs: TaskQueryArgs` from DashboardPage (URL-derived) — ensures optimistic toggle/delete patches the correct cache key

### `tasksApi` `TaskQueryArgs` (interface extension)

Adds: `search`, `status`, `priority[]`, `categoryIds[]`, `dueDateFrom`, `dueDateTo`, `page`, `pageSize`  
The `getTasks` URL builder must be updated to serialize all new params.

---

## Component Test Coverage Map

| Component | Test file | Key scenarios |
|---|---|---|
| SearchInput | `tests/component/SearchInput.test.tsx` | Submit on Enter, submit on button, empty submit clears search |
| FilterBar | `tests/component/FilterBar.test.tsx` | Status toggle, priority chip multi-select, date range validation |
| ActiveFiltersBar | `tests/component/ActiveFiltersBar.test.tsx` | Hidden when empty, shows chips, individual remove, clear all |
| DashboardPage | `tests/component/DashboardPage.test.tsx` (update) | Shows FilterBar, search wired to URL, empty state variants |
