# NFR Design Patterns — UNIT-07: Frontend Search, Filter & Pagination UI

All UNIT-03 + UNIT-05 patterns inherited. This document adds UNIT-07-specific patterns.

---

## Pattern 34 — URL as Filter State Source of Truth

**Applies to**: `DashboardPage`, `FilterBar`, `SearchInput`, `ActiveFiltersBar`, `Pagination`

All filter/search/page state is read from and written to the URL via React Router's
`useSearchParams`. Any component that needs to read filter state reads the URL; any
component that changes filter state calls `setSearchParams`.

```typescript
// DashboardPage:
const [searchParams, setSearchParams] = useSearchParams()
const sortBy = useAppSelector(selectSortBy)    // sort stays in Redux
const sortOrder = useAppSelector(selectSortOrder)

const queryArgs = buildQueryArgs(searchParams, sortBy, sortOrder)
const { data, isLoading } = useGetTasksQuery(queryArgs)

// Any filter change:
const handleFilterChange = (updates: Record<string, string | null>) => {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev)
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) next.delete(k)
      else next.set(k, v)
    })
    next.set('page', '1')   // always reset page on filter change
    return next
  })
}
```

---

## Pattern 35 — Search Local State + Submit Boundary

**Applies to**: `SearchInput`

To avoid re-querying on every keystroke (US-14), `SearchInput` holds a local `inputValue`
state. The URL is only updated when the user explicitly submits.

```typescript
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [searchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('search') ?? '')

  // Sync local state when URL changes externally (e.g. Clear all)
  useEffect(() => {
    setInputValue(searchParams.get('search') ?? '')
  }, [searchParams])

  const handleSubmit = () => onSearch(inputValue)

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button onClick={handleSubmit}>Search</button>
    </div>
  )
}
```

The `useEffect` sync ensures that when "Clear all" removes the `search` URL param,
the input field also clears.

---

## Pattern 36 — Multi-Value URL Param Serialization

**Applies to**: `FilterBar` (priority, categoryIds), `buildQueryArgs`

Priority and categoryIds are multi-value params. React Router's `URLSearchParams`
supports `getAll()` for reading and `append()` for writing multiple values with the
same key.

```typescript
// Writing multiple priority values:
const next = new URLSearchParams(prev)
next.delete('priority')                         // clear existing first
priorities.forEach((p) => next.append('priority', p))  // re-add all

// Reading:
const priority = params.getAll('priority')      // → ['High', 'Medium']
```

The `buildQueryArgs` function aggregates these into the `TaskQueryArgs` shape expected
by `tasksApi.getTasks`.

---

## Pattern 37 — Derived Active Filters List

**Applies to**: `ActiveFiltersBar` (or derived in `DashboardPage`)

Active filters are derived from URL params on every render — no separate state needed.
This keeps `ActiveFiltersBar` purely presentational (props-only, no internal state).

```typescript
function deriveActiveFilters(
  params: URLSearchParams,
  categories: CategoryDto[],
  onRemove: (key: string, value?: string) => void,
): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  const search = params.get('search')
  if (search) filters.push({
    key: 'search',
    label: `Search: "${search}"`,
    onRemove: () => onRemove('search'),
  })

  const status = params.get('status')
  if (status && status !== 'all') filters.push({
    key: 'status',
    label: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    onRemove: () => onRemove('status'),
  })

  params.getAll('priority').forEach((p) => filters.push({
    key: `priority-${p}`,
    label: `Priority: ${p}`,
    onRemove: () => onRemove('priority', p),  // remove only this value
  }))

  params.getAll('categoryIds').forEach((id) => {
    const cat = categories.find((c) => c.id === id)
    filters.push({
      key: `cat-${id}`,
      label: cat?.name ?? id,
      onRemove: () => onRemove('categoryIds', id),
    })
  })

  // dueDateFrom, dueDateTo chips omitted for brevity — same pattern

  return filters
}
```
