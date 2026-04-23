# NFR Requirements — UNIT-07: Frontend Search, Filter & Pagination UI

## Performance

All UNIT-03/UNIT-05 performance targets inherited. UNIT-07 additions:

| Requirement | Target | Enforcement |
|---|---|---|
| URL param read latency | 0 ms perceived | `useSearchParams` reads synchronously from browser URL on render |
| Filter change → query refetch | RTK Query debounce not needed | Each param change triggers one `setSearchParams` → one URL update → one query |
| FilterBar render | < 16 ms (no re-renders on every keystroke) | SearchInput uses local state; only submits to URL on Enter/button |
| Category chips in FilterBar | Load once, cached | `useGetCategoriesQuery` caches via RTK Query; no per-render fetch |

---

## Security

All UNIT-03/UNIT-05 security requirements inherited. UNIT-07 additions:

| Requirement | Implementation |
|---|---|
| URL param injection | React Router `useSearchParams` returns string values — all values treated as raw strings; RTK Query passes them as URL params to the backend which validates them via AJV |
| XSS in filter values | Filter values (search text, category names) rendered as text nodes in chips — React JSX escaping prevents XSS |
| Filter scope | All filter state changes query args for `getTasks`; the backend always enforces `userId` scoping — client cannot bypass server-side user isolation |

---

## Reliability

| Requirement | Implementation |
|---|---|
| Invalid URL params | If URL contains `?status=invalid`, AJV on backend returns 400; frontend shows error toast and task list shows empty state |
| Date range client validation | FilterBar validates `dueDateFrom < dueDateTo` before updating URL; prevents obviously invalid requests |
| Category fetch failure | If `useGetCategoriesQuery` fails in FilterBar, category chips show error message; other filters still functional |

---

## Accessibility (best-effort, inherited from UNIT-03)

| Requirement | Implementation |
|---|---|
| SearchInput label | `<label>` associated with input via `htmlFor`; placeholder supplement only |
| FilterBar controls | Status buttons: `role="group"` with `aria-label="Filter by status"`; priority/category chips: `role="checkbox"` with `aria-checked` |
| Date inputs | `<label>` associated via `htmlFor`; date inputs use native browser date picker |
| ActiveFiltersBar | Filter chips: `aria-label="Remove <filter name> filter"` on × buttons |

---

## No New npm Dependencies
UNIT-07 uses `useSearchParams` from React Router (already installed), shadcn/ui primitives (already installed), and RTK Query (already installed). No new packages.
