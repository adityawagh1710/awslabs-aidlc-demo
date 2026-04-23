# UNIT-07 Functional Design Plan — Frontend: Search, Filter & Pagination UI

**Unit**: UNIT-07: Frontend — Search, Filter & Pagination UI  
**Repository**: `todo-frontend`  
**Depends on**: UNIT-05 (DashboardPage, uiSlice, tasksApi, SortControls) + UNIT-06 (search/filter/pagination API)

## Stories Covered
- US-14 Search Tasks (frontend search input)
- US-15 Filter Tasks (FilterBar UI)
- US-16 Combined Filter + Search + Sort (all active simultaneously)
- US-06 View Task List (full Pagination component)

## Existing Frontend Context
- `uiSlice`: has `sortBy`, `sortOrder` — needs filter fields added
- `tasksApi.TaskQueryArgs`: only `sortBy`/`sortOrder` — needs all filter params added
- `DashboardPage`: uses `useGetTasksQuery({ sortBy, sortOrder })` — needs full filter wiring
- `Pagination`: renders nothing when `totalPages <= 1` — needs full page navigation

## Execution Checklist
- [x] Step 1: Analyze unit context
- [x] Step 2: Answer questions below
- [x] Step 3: Generate business-logic-model.md
- [x] Step 4: Generate business-rules.md
- [x] Step 5: Generate domain-entities.md
- [x] Step 6: Generate frontend-components.md
- [x] Step 7: Present completion message and await approval

---

## Questions for User

Please fill in the `[Answer]:` tag for each question, then reply "Done".

---

### Q1: Filter state persistence — URL vs Redux only

Should the active search/filter state persist in the URL (so users can bookmark or share filtered views)?

A) URL query params — filters encoded in URL; survive page refresh; shareable  
B) Redux only — filters reset on page refresh; simpler implementation  

[Answer]: A

---

### Q2: SearchInput submission trigger

US-14: "results update on submit (not on every keystroke for MVP)". How should submit work?

A) Enter key press only  
B) Explicit "Search" button only  
C) Both — Enter key press AND a "Search" button  

[Answer]: C

---

### Q3: FilterBar visibility — always visible vs collapsible

With multiple filter controls (status, priority, categories, date range), how should they be shown?

A) Always visible inline above the task list (expanded by default)  
B) Hidden behind a "Filters" button — open as a panel below the toolbar  
C) Collapsed by default; expand with a "Show filters" toggle — stays on the same page  

[Answer]: A

---

### Q4: Active filters display — chips vs summary

US-16 says the "active filter and search state is visible". What format for the active filter indicator?

A) Individual chips per active filter, each with an × to remove, plus a "Clear all" button  
B) Simple "N filters active" badge with a single "Clear all" button  
C) Both — chips for individual removal AND a "Clear all" button  

[Answer]: C
