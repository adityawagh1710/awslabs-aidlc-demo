# UNIT-05 Code Generation Plan — Frontend: Task CRUD & Categories UI

**Unit**: UNIT-05: Frontend — Task CRUD & Categories UI  
**Repository**: `todo-frontend`  
**Workspace root**: `/home/adityawagh/awslabs-aidlc-demo`  
**Application code location**: `todo-frontend/` (NEVER aidlc-docs/)

## Unit Context

**Dependencies**: UNIT-03 (auth, store, routing, AppShell, shadcn/ui base), UNIT-04 (task/category API)

**Stories implemented**: US-05, US-06 (basic list+sort), US-07, US-08, US-09, US-10, US-11, US-12, US-13

**Key design decisions**:
- Table layout (Q6:B) — TaskList renders `<table>`, TaskRow renders `<tr>`
- Separate routes (Q1:A) — `/tasks/new`, `/tasks/:id`, `/tasks/:id/edit`, `/categories`
- Optimistic UI (Q2:A) — both toggle and delete use RTK Query `onQueryStarted` patch + undo
- Red left-border (Q3:B) — `border-l-4 border-red-500` on `<tr>` when `isOverdue`
- Chip toggles (Q4:B) — CategoryPicker shows category chips, click to select/deselect
- Two-control sort (Q5:B) — SortControls: "Sort by" Select + "↑/↓" Button

**Files to modify** (existing):
- `src/types/api.ts` — add TaskDto, CategoryDto, request types
- `src/store/uiSlice.ts` — add sortBy/sortOrder state + actions + selectors
- `src/store/index.ts` — wire tasksApi, categoriesApi, listenerMiddleware
- `src/pages/DashboardPage.tsx` — replace placeholder with real implementation
- `src/App.tsx` — add 4 new lazy routes
- `tests/utils/renderWithProviders.tsx` — add tasksApi, categoriesApi to test store
- `tests/setup.ts` — add MSW handlers for task/category endpoints
- `tests/unit/uiSlice.test.ts` — add sort state tests

**Files to create** (new):
- `src/store/api/tasksApi.ts`
- `src/store/api/categoriesApi.ts`
- `src/components/ui/dialog.tsx`
- `src/components/ui/select.tsx`
- `src/components/shared/ConfirmDialog.tsx`
- `src/components/shared/Pagination.tsx`
- `src/components/tasks/TaskList.tsx`
- `src/components/tasks/TaskRow.tsx`
- `src/components/tasks/TaskForm.tsx`
- `src/components/tasks/SortControls.tsx`
- `src/components/tasks/CategoryPicker.tsx`
- `src/components/categories/CategoryManager.tsx`
- `src/pages/TaskFormPage.tsx`
- `src/pages/TaskDetailPage.tsx`
- `src/pages/CategoryManagementPage.tsx`
- `tests/component/DashboardPage.test.tsx`
- `tests/component/TaskRow.test.tsx`
- `tests/component/TaskForm.test.tsx`
- `tests/component/CategoryPicker.test.tsx`
- `tests/property/tasks-frontend.property.test.ts`
- `aidlc-docs/construction/unit-05/code/summary.md`

---

## Execution Checklist

### Part A: Dependencies (Step 1)
- [x] Step 1: Install `@radix-ui/react-dialog` and `@radix-ui/react-select` in `todo-frontend/`

### Part B: API Types & Store (Steps 2–5)
- [x] Step 2: Update `src/types/api.ts` — add TaskDto, CategoryDto, CreateTaskRequest, UpdateTaskRequest, CreateCategoryRequest, UpdateCategoryRequest, Priority
- [x] Step 3: Create `src/store/api/tasksApi.ts` — 6 endpoints with optimistic toggle (Pattern 23) and optimistic delete (Pattern 24)
- [x] Step 4: Create `src/store/api/categoriesApi.ts` — 4 endpoints
- [x] Step 5: Update `src/store/uiSlice.ts` — add sortBy/sortOrder state, setSortBy/setSortOrder actions, selectSortBy/selectSortOrder selectors
- [x] Step 6: Update `src/store/index.ts` — add tasksApi/categoriesApi reducers+middleware, add listenerMiddleware for cache reset on logout (Pattern 26)

### Part C: shadcn/ui Primitives (Steps 7–8)
- [x] Step 7: Create `src/components/ui/dialog.tsx` — shadcn/ui dialog wrapping @radix-ui/react-dialog
- [x] Step 8: Create `src/components/ui/select.tsx` — shadcn/ui select wrapping @radix-ui/react-select

### Part D: Shared Components (Steps 9–10)
- [x] Step 9: Create `src/components/shared/ConfirmDialog.tsx` — uses dialog.tsx, loading state on confirm button
- [x] Step 10: Create `src/components/shared/Pagination.tsx` — renders nothing when totalPages ≤ 1

### Part E: Task Components (Steps 11–15)
- [x] Step 11: Create `src/components/tasks/TaskList.tsx` — `<table>` with caption, col headers, TaskRow per task, loading + empty states
- [x] Step 12: Create `src/components/tasks/TaskRow.tsx` — `<tr>` with red left-border on isOverdue, completion checkbox, title link, priority badge, due date, edit/delete actions
- [x] Step 13: Create `src/components/tasks/TaskForm.tsx` — RHF + Zod, all fields including CategoryPicker, auto-detect timezone on submit
- [x] Step 14: Create `src/components/tasks/SortControls.tsx` — Sort by Select + direction Button, reads/writes uiSlice
- [x] Step 15: Create `src/components/tasks/CategoryPicker.tsx` — chip toggles with max-10 guard (Pattern 27)

### Part F: Category Components (Step 16)
- [x] Step 16: Create `src/components/categories/CategoryManager.tsx` — inline create form + list with rename/delete

### Part G: Pages (Steps 17–20)
- [x] Step 17: Update `src/pages/DashboardPage.tsx` — replace placeholder; toolbar + TaskList + Pagination
- [x] Step 18: Create `src/pages/TaskFormPage.tsx` — create/edit modes, lazy-loaded
- [x] Step 19: Create `src/pages/TaskDetailPage.tsx` — fetch by id, 403/404 guard (Pattern 28), edit/delete/toggle actions, lazy-loaded
- [x] Step 20: Create `src/pages/CategoryManagementPage.tsx` — wraps CategoryManager, lazy-loaded

### Part H: Router Update (Step 21)
- [x] Step 21: Update `src/App.tsx` — add 4 lazy-loaded routes wrapped in Suspense

### Part I: Tests (Steps 22–26)
- [x] Step 22: Update `tests/utils/renderWithProviders.tsx` — add tasksApi, categoriesApi to test store
- [x] Step 23: Update `tests/setup.ts` — add MSW handlers for GET/POST/PUT/DELETE/PATCH task + category endpoints
- [x] Step 24: Update `tests/unit/uiSlice.test.ts` — add sortBy/sortOrder action tests
- [x] Step 25: Create `tests/component/TaskRow.test.tsx` — overdue border, completed styling, toggle, delete confirm
- [x] Step 26: Create `tests/component/TaskForm.test.tsx` — validation errors, submit, pre-populate
- [x] Step 27: Create `tests/component/CategoryPicker.test.tsx` — toggle chips, max-10 guard, empty state
- [x] Step 28: Create `tests/component/DashboardPage.test.tsx` — renders task list, empty state, new task button
- [x] Step 29: Create `tests/property/tasks-frontend.property.test.ts` — PBT-CLIENT-04 through PBT-CLIENT-07

### Part J: Documentation (Step 30)
- [x] Step 30: Create `aidlc-docs/construction/unit-05/code/summary.md`

---

## Story Traceability

| Story | Implemented By Steps |
|---|---|
| US-05 Create a Task | Steps 3, 13, 18 |
| US-06 View Task List (basic sort) | Steps 3, 5, 11, 14, 17 |
| US-07 View Task Details | Steps 3, 19 |
| US-08 Edit a Task | Steps 3, 13, 18 |
| US-09 Delete a Task | Steps 3, 9, 12, 19 |
| US-10 Toggle Completion | Steps 3, 12, 19 |
| US-11 Overdue Indicators | Steps 3, 12 |
| US-12 Manage Categories | Steps 4, 16, 20 |
| US-13 Assign/Remove Tags | Steps 4, 15, 13 |

**Total steps: 30 across 10 parts**
