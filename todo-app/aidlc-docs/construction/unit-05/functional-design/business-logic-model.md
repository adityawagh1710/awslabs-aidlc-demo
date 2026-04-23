# Business Logic Model — UNIT-05: Frontend Task CRUD & Categories UI

## Routing Structure (Q1:A)

```
/ (DashboardPage)          — task table + sort controls
/tasks/new                 — TaskFormPage (create mode)
/tasks/:id                 — TaskDetailPage
/tasks/:id/edit            — TaskFormPage (edit mode)
/categories                — CategoryManagementPage
```

All routes nested under `<ProtectedRoute>` → `<AppShell>`.

---

## Flow 1: View Task List (DashboardPage)

```
User navigates to /
    │
    ▼
DashboardPage mounts
    │
    ▼
useGetTasksQuery({ sortBy, sortOrder })   ← reads from uiSlice sort state
    │
    ├── loading  → LoadingSpinner
    ├── error    → toast "Failed to load tasks"
    └── success  → TaskList (table)
                      └── TaskRow per task
                            ├── isOverdue=true → red left-border accent on row
                            └── completed=true → strikethrough title, muted row
```

---

## Flow 2: Create Task

```
User clicks "New Task" button on DashboardPage
    │
    ▼
navigate('/tasks/new')
    │
    ▼
TaskFormPage (mode='create') mounts
    │  useGetCategoriesQuery() → load user categories for CategoryPicker
    ▼
User fills TaskForm (RHF + Zod validation)
    │  client-side: title required, max lengths, due date ≥ today
    ▼
Submit → useCreateTaskMutation()
    │
    ├── success → invalidate task list cache → navigate('/') → success toast
    └── error   → display field errors or error toast
```

---

## Flow 3: View Task Detail

```
User clicks task row → navigate('/tasks/:id')
    │
    ▼
TaskDetailPage mounts → useGetTaskByIdQuery(id)
    │
    ├── loading  → LoadingSpinner
    ├── 404/403  → toast + navigate('/')
    └── success  → render all task fields
                      ├── Edit button → navigate('/tasks/:id/edit')
                      ├── Delete button → open ConfirmDialog
                      └── Toggle completion button
```

---

## Flow 4: Edit Task

```
User navigates to /tasks/:id/edit
    │
    ▼
TaskFormPage (mode='edit') mounts
    │  useGetTaskByIdQuery(id) → pre-populate form fields
    │  useGetCategoriesQuery() → load categories for CategoryPicker
    ▼
User modifies fields → Submit → useUpdateTaskMutation({ id, ...body })
    │
    ├── success → invalidate task list + task detail cache → navigate('/tasks/:id') → toast
    └── error   → display field errors or error toast
```

---

## Flow 5: Delete Task (Optimistic, Q2:A)

```
User clicks Delete (in TaskRow or TaskDetailPage)
    │
    ▼
ConfirmDialog opens: "Delete this task? This cannot be undone."
    │
    ├── Cancel → close dialog
    └── Confirm
            │
            ▼
        Optimistic: remove task from getTasks cache immediately
            │
            ▼
        useDeleteTaskMutation(id)
            │
            ├── success → invalidate cache (confirms removal) → toast "Task deleted"
            │             if on TaskDetailPage → navigate('/')
            └── error   → undo cache patch → toast "Failed to delete task"
```

---

## Flow 6: Toggle Task Completion (Optimistic, Q2:A)

```
User clicks completion checkbox/button in TaskRow or TaskDetailPage
    │
    ▼
Optimistic: flip task.completed in getTasks cache immediately
    │        (and in getTaskById cache if detail page)
    ▼
useToggleTaskMutation(id)  →  PATCH /api/v1/tasks/:id/toggle
    │
    ├── success → cache updated with server response (isOverdue recalculated)
    └── error   → undo optimistic patch → toast "Failed to update task"
```

---

## Flow 7: Create/Rename/Delete Category (CategoryManagementPage)

```
User navigates to /categories
    │
    ▼
CategoryManagementPage → useGetCategoriesQuery()
    │
    ├── Empty state: "No categories yet. Create one!"
    └── CategoryManager list:
          ├── Inline "New category" form at top → useCreateCategoryMutation()
          ├── Each category row:
          │     ├── Rename (inline edit) → useUpdateCategoryMutation()
          │     └── Delete button → ConfirmDialog → useDeleteCategoryMutation()
          └── On delete success: toast "Category deleted. Affected tasks untagged."
```

---

## Flow 8: CategoryPicker (Tag-style chips, Q4:B)

```
TaskForm renders CategoryPicker when user has categories
    │
    ▼
All user categories shown as clickable chips
    │  Selected chips: filled/colored (bg-primary text-primary-foreground)
    │  Unselected chips: outlined (border variant)
    ▼
Click chip → toggle categoryId in RHF field array
    │
    │  Max 10 enforced: if 10 already selected, unselected chips are disabled
    │  "0 categories" shows empty-state prompt to create one first
    └── Value passed to form submission as categoryIds: string[]
```

---

## Flow 9: Sort Controls (Q5:B)

```
SortControls renders two controls:
    │
    ├── "Sort by" <Select>:
    │     options: Due Date | Priority | Created Date | Title
    │     default: (empty = server default)
    │
    └── Direction <Button> (toggle ↑/↓):
          asc → desc on click; disabled if no sortBy selected
    │
    ▼
On change → dispatch setSortBy / setSortOrder to uiSlice
    │
    ▼
DashboardPage re-renders → useGetTasksQuery({ sortBy, sortOrder }) refetches
```
