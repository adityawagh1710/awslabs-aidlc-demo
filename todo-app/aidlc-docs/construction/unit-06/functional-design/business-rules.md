# Business Rules — UNIT-06: Backend Search, Filter & Pagination

## Search Rules

### BR-S-01: Search — PostgreSQL FTS with plainto_tsquery (Q1:B)
- Full-text search uses a `search_vector` STORED generated column on `tasks`
- `search_vector = to_tsvector('english', title || ' ' || COALESCE(description, ''))`
- Query uses `search_vector @@ plainto_tsquery('english', $query)`
- Language: `'english'` — enables English stemming (buy/buying/bought all match)
- Case-insensitive and stemming-aware (US-14 requirement)

### BR-S-02: Empty search — treated as no filter
- `search=` (empty string) OR search param absent → FTS predicate NOT added
- Both return all tasks (subject to other filters)
- "Searching with empty string returns all tasks" (US-14 AC)

### BR-S-03: Search max length
- `search` query param max: 500 characters
- Exceeding → 400 validation error

### BR-S-04: Search scope — user-scoped only
- FTS never returns tasks belonging to another user; `userId` filter is always primary

---

## Filter Rules

### BR-F-17: Status filter enum (Q4:B)
- Valid values: `'active'` | `'completed'` | `'all'`
- `status=active` → `WHERE status = 'ACTIVE'`
- `status=completed` → `WHERE status = 'COMPLETED'`
- `status=all` → no status predicate (all tasks returned)
- No `status` param → no status predicate (same runtime effect as `all`)
- AJV rejects any value outside these three → 400

### BR-F-18: Priority filter — multi-value
- Accepts array: `priority=High&priority=Medium` or comma-separated `priority=High,Medium`
- Valid values per item: `'Low'` | `'Medium'` | `'High'`
- If provided: `WHERE priority IN (?)`
- Multiple values use OR within the priority dimension (standard multi-select behaviour)
- Invalid value → 400

### BR-F-19: Category filter — OR-within, AND-with-others
- Accepts array of category UUIDs: `categoryIds=cat1&categoryIds=cat2`
- Returns tasks that have AT LEAST ONE of the supplied categories (OR within category filter)
- AND-combined with other active filters per US-16
- Non-existent or unowned category IDs: silently excluded (no 403 — filter, not write operation)

### BR-F-20: Date range — inclusive-from, exclusive-to (Q3:B)
- `dueDateFrom`: `WHERE due_date >= ?` (inclusive)
- `dueDateTo`: `WHERE due_date < ?` (exclusive — task due ON `dueDateTo` is NOT included)
- Both optional; can be used independently
- If both present: `dueDateFrom` must be strictly before `dueDateTo`
  → Violation: 400 `"dueDateFrom must be before dueDateTo"`
- Date strings must be valid ISO date format (YYYY-MM-DD) → 400 if malformed

---

## Pagination Rules

### BR-P-01: Default page/pageSize
- Default: `page=1`, `pageSize=25`

### BR-P-02: Maximum pageSize (Q2:B)
- Maximum `pageSize`: 50
- `pageSize > 50` → 400: `"pageSize must be between 1 and 50"`
- `pageSize < 1` → 400
- `page < 1` → 400

### BR-P-03: Pagination applies to filtered result set
- `total` and `totalPages` reflect the filtered/searched count, not the full user task count
- Pagination controls the window over the filtered result (US-16 AC)

### BR-P-04: Out-of-range page
- If `page > totalPages` (and `totalPages > 0`) → return empty `items: []` with correct `total`
- No 404 — empty page is valid response

---

## Combined Filter Logic

### BR-C-01: AND across all active filter dimensions (US-16)
- All active filters are combined with logical AND
- Example: `status=active&priority=High&search=urgent` returns only tasks that are:
  active AND High priority AND contain "urgent" in title/description

### BR-C-02: Sort order preserved across filter changes
- Sort parameters (`sortBy`, `sortOrder`) are independent of filter parameters
- Changing one filter does not reset sort

---

## Property-Based Test Invariants

| ID | Property | Description |
|---|---|---|
| PBT-FILTER-01 | User isolation | Filtered results never include tasks from other users |
| PBT-FILTER-02 | Status filter soundness | `status=active` never returns a task with `completed=true` |
| PBT-FILTER-03 | Pagination bound | `items.length <= pageSize` always |
| PBT-FILTER-04 | AND narrowing | Result of (filter A + filter B) is subset of result of (filter A alone) |
| PBT-FILTER-05 | Total count consistency | Sum of items across all pages equals `total` |
| PBT-FILTER-06 | Empty search equivalence | `GET /tasks?search=` returns same total as `GET /tasks` (no search) |
