# UNIT-07 Code Generation Plan — Frontend: Search, Filter & Pagination UI

**Unit**: UNIT-07: Frontend — Search, Filter & Pagination UI  
**Repository**: `todo-frontend`

## Execution Checklist

### Part A: Store Extension (Step 1)
- [x] Step 1: Extend `src/store/api/tasksApi.ts` — add filter params to `TaskQueryArgs`; update `getTasks` URL builder to serialize multi-value params

### Part B: New Components (Steps 2–4)
- [x] Step 2: Create `src/components/tasks/SearchInput.tsx` — local state + Enter/button submit (Pattern 35)
- [x] Step 3: Create `src/components/tasks/FilterBar.tsx` — status toggles, priority chips, category chips, date range
- [x] Step 4: Create `src/components/tasks/ActiveFiltersBar.tsx` — derived chips + clear all (Pattern 37)

### Part C: Page Update (Step 5)
- [x] Step 5: Update `src/pages/DashboardPage.tsx` — useSearchParams URL state (Pattern 34), wire all filter components, functional Pagination

### Part D: Tests (Steps 6–10)
- [x] Step 6: Create `tests/component/SearchInput.test.tsx`
- [x] Step 7: Create `tests/component/FilterBar.test.tsx`
- [x] Step 8: Create `tests/component/ActiveFiltersBar.test.tsx`
- [x] Step 9: Update `tests/component/DashboardPage.test.tsx` — add filter/URL scenarios
- [x] Step 10: Create `tests/property/url-filters.property.test.ts` — PBT-UI-01 through PBT-UI-04

### Part E: Documentation (Step 11)
- [x] Step 11: Create `aidlc-docs/construction/unit-07/code/summary.md`

**Total steps: 11 across 5 parts**
