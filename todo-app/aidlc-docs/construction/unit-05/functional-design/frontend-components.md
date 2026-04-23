# Frontend Components — UNIT-05: Frontend Task CRUD & Categories UI

## Component Hierarchy

```
App.tsx (updated routes)
  └── <ProtectedRoute>
        └── <AppShell>
              ├── /                    → <DashboardPage>
              │     ├── <SortControls>
              │     ├── <TaskList>
              │     │     └── <TaskRow> × N  (table rows)
              │     │           └── overdue → red left-border
              │     └── <Pagination> (basic, page 1 of 1)
              │
              ├── /tasks/new           → <TaskFormPage mode="create">
              │     └── <TaskForm>
              │           └── <CategoryPicker>
              │
              ├── /tasks/:id           → <TaskDetailPage>
              │     └── <ConfirmDialog> (delete)
              │
              ├── /tasks/:id/edit      → <TaskFormPage mode="edit">
              │     └── <TaskForm>
              │           └── <CategoryPicker>
              │
              └── /categories          → <CategoryManagementPage>
                    └── <CategoryManager>
                          └── <ConfirmDialog> (delete category)
```

---

## Page Components

### `DashboardPage` (replaces placeholder)

| Attribute | Detail |
|---|---|
| **File** | `src/pages/DashboardPage.tsx` |
| **RTK Query** | `useGetTasksQuery({ sortBy, sortOrder })` |
| **Redux** | Reads `selectSortBy`, `selectSortOrder` from uiSlice |
| **Layout** | Toolbar row (SortControls + "New Task" button) + TaskList table + Pagination |
| **Empty state** | "No tasks yet. Create your first task!" + New Task button |
| **data-testid** | `dashboard-page`, `dashboard-new-task-button` |

### `TaskFormPage`

| Attribute | Detail |
|---|---|
| **File** | `src/pages/TaskFormPage.tsx` |
| **Props** | `{ mode: 'create' \| 'edit' }` |
| **Create mode** | Pre-populates empty form; calls `useCreateTaskMutation` |
| **Edit mode** | Reads `:id` from URL params; fetches task via `useGetTaskByIdQuery`; pre-populates form |
| **On success** | Create → navigate('/'); Edit → navigate(`/tasks/${id}`) |
| **Back link** | Create → '/'; Edit → `/tasks/${id}` |
| **data-testid** | `task-form-page` |

### `TaskDetailPage`

| Attribute | Detail |
|---|---|
| **File** | `src/pages/TaskDetailPage.tsx` |
| **RTK Query** | `useGetTaskByIdQuery(id)` |
| **Fields shown** | Title, description, priority badge, due date, overdue indicator, completion status, categories, createdAt, updatedAt |
| **Actions** | Edit button → `/tasks/:id/edit`; Delete button → ConfirmDialog |
| **Delete** | On confirm: optimistic removal + `useDeleteTaskMutation` → navigate('/') on success |
| **Back link** | ← Back to tasks (navigate to '/') |
| **data-testid** | `task-detail-page`, `task-detail-edit-button`, `task-detail-delete-button` |

### `CategoryManagementPage`

| Attribute | Detail |
|---|---|
| **File** | `src/pages/CategoryManagementPage.tsx` |
| **RTK Query** | `useGetCategoriesQuery()` |
| **Layout** | Page title + CategoryManager component |
| **Back link** | ← Back to tasks |
| **data-testid** | `category-management-page` |

---

## Feature Components

### `TaskList` (table)

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/TaskList.tsx` |
| **Props** | `{ tasks: TaskDto[]; isLoading: boolean }` |
| **Renders** | `<table>` with header row (Title, Priority, Due Date, Status, Actions) + `<TaskRow>` per task |
| **Empty** | colspan full-width empty state cell |
| **data-testid** | `task-list`, `task-list-table` |

### `TaskRow` (table row)

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/TaskRow.tsx` |
| **Props** | `{ task: TaskDto }` |
| **Overdue** | `task.isOverdue` → `className="border-l-4 border-red-500"` on `<tr>` (Q3:B) |
| **Completed** | Title cell: `line-through text-muted-foreground` |
| **Columns** | Completion toggle checkbox \| Title (link to detail) \| Priority badge \| Due date \| Actions (Edit, Delete) |
| **Toggle** | Checkbox click → `useToggleTaskMutation` with optimistic update |
| **Delete** | Delete icon button → ConfirmDialog |
| **Navigate** | Title click → navigate(`/tasks/${task.id}`) |
| **data-testid** | `task-row-${id}`, `task-row-toggle-${id}`, `task-row-edit-${id}`, `task-row-delete-${id}` |

### `TaskForm`

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/TaskForm.tsx` |
| **Props** | `{ mode: 'create' \| 'edit'; initialValues?: Partial<TaskDto>; onSubmit: (v) => Promise<void>; isSubmitting: boolean }` |
| **Fields** | Title (text), Description (textarea), Priority (select), Due Date (date input), Categories (CategoryPicker) |
| **Validation** | RHF + Zod (`taskSchema`) — inline errors on blur |
| **Due date min** | `min={new Date().toISOString().split('T')[0]}` — client-side enforcement |
| **Timezone** | Auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone` and added to submission |
| **data-testid** | `task-form`, `task-form-title`, `task-form-description`, `task-form-priority`, `task-form-due-date`, `task-form-submit` |

### `CategoryPicker` (chip toggles, Q4:B)

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/CategoryPicker.tsx` |
| **Props** | `{ categories: CategoryDto[]; value: string[]; onChange: (ids: string[]) => void; maxSelected?: number }` |
| **Renders** | Category name as clickable chips |
| **Selected chip** | `bg-primary text-primary-foreground` |
| **Unselected chip** | `border border-input` (outline variant) |
| **Max 10** | When 10 selected: unselected chips get `opacity-50 pointer-events-none` |
| **Empty** | "No categories yet. [Create one]" link to /categories |
| **data-testid** | `category-picker`, `category-chip-${id}` |

### `SortControls` (Q5:B)

| Attribute | Detail |
|---|---|
| **File** | `src/components/tasks/SortControls.tsx` |
| **Redux** | Reads/dispatches `sortBy` and `sortOrder` from uiSlice |
| **Sort by select** | Options: (default), Due Date, Priority, Created Date, Title |
| **Direction button** | `↑` (asc) / `↓` (desc) toggle; disabled when no sortBy selected |
| **data-testid** | `sort-controls`, `sort-by-select`, `sort-order-toggle` |

### `OverdueBadge` (applied as CSS on TaskRow, not a separate component)

Applied directly as a Tailwind class on the `<tr>` in TaskRow:
```tsx
<tr className={cn('border-b', task.isOverdue && 'border-l-4 border-red-500')}>
```
No separate component needed — the "badge" is the row border.

### `Pagination` (basic)

| Attribute | Detail |
|---|---|
| **File** | `src/components/shared/Pagination.tsx` |
| **Props** | `{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }` |
| **UNIT-05 behavior** | Backend returns all tasks as page 1 of 1; component renders but shows nothing when `totalPages <= 1` |
| **UNIT-07** | Will be fully wired with real pagination |
| **data-testid** | `pagination` |

### `ConfirmDialog`

| Attribute | Detail |
|---|---|
| **File** | `src/components/shared/ConfirmDialog.tsx` |
| **Props** | `{ isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; isLoading?: boolean }` |
| **Implementation** | Uses Radix UI Dialog (add `@radix-ui/react-dialog` — or use shadcn/ui dialog component) |
| **data-testid** | `confirm-dialog`, `confirm-dialog-confirm`, `confirm-dialog-cancel` |

### `CategoryManager`

| Attribute | Detail |
|---|---|
| **File** | `src/components/categories/CategoryManager.tsx` |
| **RTK Query** | `useCreateCategoryMutation`, `useUpdateCategoryMutation`, `useDeleteCategoryMutation` |
| **Create** | Inline form at top of list; on submit → `useCreateCategoryMutation` |
| **Rename** | Click category name → inline edit input; on blur/Enter → `useUpdateCategoryMutation` |
| **Delete** | Trash icon → ConfirmDialog |
| **data-testid** | `category-manager`, `category-manager-new-input`, `category-item-${id}`, `category-item-delete-${id}` |

---

## Component Test Coverage Map

| Component | Test file | Key scenarios |
|---|---|---|
| DashboardPage | `tests/DashboardPage.test.tsx` | Renders task list, empty state, new task button |
| TaskRow | `tests/TaskRow.test.tsx` | Overdue border, completed strikethrough, toggle, delete |
| TaskForm | `tests/TaskForm.test.tsx` | Validation errors, submit with valid data, pre-populate on edit |
| CategoryPicker | `tests/CategoryPicker.test.tsx` | Toggle chips, max 10 enforcement, empty state |
| SortControls | `tests/SortControls.test.tsx` | Dispatches sort actions, direction disabled without sortBy |
| CategoryManager | `tests/CategoryManager.test.tsx` | Create, rename, delete with confirm |
