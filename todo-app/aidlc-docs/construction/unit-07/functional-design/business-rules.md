# Business Rules — UNIT-07: Frontend Search, Filter & Pagination UI

## Search Rules

### BR-U-01: Search submits on Enter or button click (Q2:C)
- SearchInput has a controlled input + "Search" button
- Pressing Enter key triggers the same handler as clicking the button
- No search-on-keystroke (US-14: "results update on submit")
- Local input state is uncontrolled until submit — no re-renders per keystroke

### BR-U-02: Empty search clears search filter
- If user clears the input and submits → remove `search` param from URL; page resets to 1
- Equivalent to no search filter (US-14: "empty string returns all tasks")

### BR-U-03: Search resets page to 1
- Any search submission resets `page` URL param to `'1'`
- Prevents "page 5" state with a new search that has only 1 page

---

## Filter Rules

### BR-U-04: Filter state lives in URL (Q1:A)
- All of `search`, `status`, `priority`, `categoryIds`, `dueDateFrom`, `dueDateTo`, `page` are URL query params
- URL is the source of truth — survives page refresh and can be shared
- Sort (`sortBy`, `sortOrder`) remains in Redux from UNIT-05

### BR-U-05: Filter change resets page to 1
- Any filter change (status, priority, category, date range) resets `page` to `'1'`
- Prevents showing an empty page when filter reduces total below current page

### BR-U-06: FilterBar always visible (Q3:A)
- Filter controls are always rendered inline above the task list
- No toggle or collapse; no "show/hide filters" button

### BR-U-07: Priority filter — multi-select chips
- Low, Medium, High displayed as toggle chips in FilterBar
- Click to toggle selection; multiple can be active simultaneously
- Active priority chips visually filled; inactive outlined
- URL: `priority=High&priority=Medium` (multi-value) OR `priority=High,Medium`

### BR-U-08: Category filter — multi-select from user's categories
- Categories loaded via `useGetCategoriesQuery`
- Displayed as toggle chips in FilterBar
- URL: `categoryIds=cat1&categoryIds=cat2`

### BR-U-09: Date range filter
- Two date inputs: "From" and "To"
- Both optional; client validates `from < to` before updating URL
- If `from >= to` → inline error shown; URL not updated

### BR-U-10: Status filter — toggle buttons
- Three mutually exclusive options: All / Active / Completed
- "All" = remove status param from URL (no filter)
- Clicking the already-active option does nothing (stays selected)

---

## Active Filters Rules (Q4:C)

### BR-U-11: ActiveFiltersBar shows both chips and "Clear all"
- Rendered below FilterBar/SearchInput when at least one filter is active
- Hidden when no filters are active (search AND all filter params absent)

### BR-U-12: Individual filter chips
- Each active filter produces a labeled chip with an × button
- Search chip: "Search: urgent" × → removes `search` param
- Status chip: "Status: Active" × → removes `status` param
- Priority chip: "Priority: High, Medium" × → removes `priority` params
- Category chip: one chip per active category, showing category name × → removes that categoryId
- Date chips: "From: 2026-05-01" × and/or "To: 2026-05-31" × → remove respective params

### BR-U-13: "Clear all" button removes all filter params
- Removes: `search`, `status`, `priority`, `categoryIds`, `dueDateFrom`, `dueDateTo`, `page`
- Preserves: `sortBy`, `sortOrder` (sort is not a "filter")

---

## Pagination Rules

### BR-U-14: Pagination fully wired in UNIT-07
- `Pagination` component now calls `onPageChange(p) => setSearchParams({...params, page: p})`
- `currentPage` read from URL `page` param (default 1)
- `totalPages` from `useGetTasksQuery` response
- Renders nothing when `totalPages <= 1` (unchanged from UNIT-05)

### BR-U-15: Changing page preserves all other URL params
- Only `page` param changes when navigating; all filter/search/sort params preserved

---

## Empty State Rules

### BR-U-16: Context-aware empty state messages (US-16)
- If `items.length === 0` AND active filters exist:
  → "No tasks match the current filters." + "Clear filters" button
- If `items.length === 0` AND no active filters:
  → "No tasks yet. Create your first task!" + "New Task" button

---

## PBT Invariants

| ID | Property | Description |
|---|---|---|
| PBT-UI-01 | URL round-trip | Serializing filter state to URL params and reading back produces identical state |
| PBT-UI-02 | Clear all completeness | After "Clear all", no filter params remain in URL |
| PBT-UI-03 | Page reset on filter change | Any filter change always sets page to 1 in URL |
| PBT-UI-04 | Page change preserves filters | Changing page never removes search/filter params from URL |
