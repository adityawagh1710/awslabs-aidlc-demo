# Code Summary — UNIT-05: Frontend Task CRUD & Categories UI

## New Files Created

| File | Purpose |
|---|---|
| `todo-frontend/src/store/api/tasksApi.ts` | RTK Query — 6 endpoints with optimistic toggle (Pattern 23) and optimistic delete (Pattern 24) |
| `todo-frontend/src/store/api/categoriesApi.ts` | RTK Query — 4 CRUD endpoints |
| `todo-frontend/src/components/ui/dialog.tsx` | shadcn/ui dialog primitive |
| `todo-frontend/src/components/ui/select.tsx` | shadcn/ui select primitive |
| `todo-frontend/src/components/shared/ConfirmDialog.tsx` | Reusable confirm dialog with loading state |
| `todo-frontend/src/components/shared/Pagination.tsx` | Basic pagination (hidden when totalPages ≤ 1) |
| `todo-frontend/src/components/tasks/TaskList.tsx` | `<table>` wrapper with loading/empty states |
| `todo-frontend/src/components/tasks/TaskRow.tsx` | `<tr>` with red left-border on isOverdue, toggle, actions |
| `todo-frontend/src/components/tasks/TaskForm.tsx` | RHF + Zod form (all task fields + CategoryPicker) |
| `todo-frontend/src/components/tasks/SortControls.tsx` | Sort by select + direction toggle button |
| `todo-frontend/src/components/tasks/CategoryPicker.tsx` | Chip-toggle category selector (max-10 guard) |
| `todo-frontend/src/components/categories/CategoryManager.tsx` | Inline create/rename/delete category list |
| `todo-frontend/src/pages/TaskFormPage.tsx` | Create/edit task page (lazy-loaded) |
| `todo-frontend/src/pages/TaskDetailPage.tsx` | Task detail with 403/404 guard (lazy-loaded) |
| `todo-frontend/src/pages/CategoryManagementPage.tsx` | Category CRUD page (lazy-loaded) |
| `tests/component/TaskRow.test.tsx` | Overdue border, completed styling, toggle, delete confirm |
| `tests/component/TaskForm.test.tsx` | Validation, submit, pre-populate |
| `tests/component/CategoryPicker.test.tsx` | Toggle, max-10 guard, empty state |
| `tests/component/DashboardPage.test.tsx` | Page renders, sort controls, new task button |
| `tests/property/tasks-frontend.property.test.ts` | PBT-CLIENT-05, PBT-CLIENT-07 |

## Modified Files

| File | Change |
|---|---|
| `src/types/api.ts` | Added TaskDto, CategoryDto, PaginatedTasksDto, request types |
| `src/store/uiSlice.ts` | Added sortBy/sortOrder state, setSortBy/setSortOrder actions + selectors |
| `src/store/index.ts` | Added tasksApi, categoriesApi, listenerMiddleware for logout cache reset |
| `src/pages/DashboardPage.tsx` | Replaced placeholder with full table + sort + pagination |
| `src/App.tsx` | Added 4 lazy-loaded routes: /tasks/new, /tasks/:id, /tasks/:id/edit, /categories |
| `tests/utils/renderWithProviders.tsx` | Added tasksApi, categoriesApi to test store |
| `tests/setup.ts` | Added MSW handlers for all task + category endpoints |
| `tests/unit/uiSlice.test.ts` | Added sort state tests (5 new cases) |

## New npm Dependencies

| Package | Purpose |
|---|---|
| `@radix-ui/react-dialog` | ConfirmDialog foundation |
| `@radix-ui/react-select` | SortControls sort-by dropdown |

## New Routes

| Path | Component | Lazy |
|---|---|---|
| `/tasks/new` | TaskFormPage (create) | ✓ |
| `/tasks/:id` | TaskDetailPage | ✓ |
| `/tasks/:id/edit` | TaskFormPage (edit) | ✓ |
| `/categories` | CategoryManagementPage | ✓ |

## Stories Implemented
US-05, US-06 (basic list+sort), US-07, US-08, US-09, US-10, US-11, US-12, US-13
