# Logical Components — UNIT-05: Frontend Task CRUD & Categories UI

## File Structure (new files)

```
src/
├── store/
│   ├── api/
│   │   ├── tasksApi.ts              ← NEW — RTK Query task endpoints + optimistic mutations
│   │   └── categoriesApi.ts         ← NEW — RTK Query category endpoints
│   ├── uiSlice.ts                   ← MODIFIED — add sortBy/sortOrder state
│   └── index.ts                     ← MODIFIED — add tasksApi, categoriesApi
├── pages/
│   ├── DashboardPage.tsx            ← MODIFIED — replaces placeholder
│   ├── TaskFormPage.tsx             ← NEW (lazy)
│   ├── TaskDetailPage.tsx           ← NEW (lazy)
│   └── CategoryManagementPage.tsx   ← NEW (lazy)
├── components/
│   ├── tasks/
│   │   ├── TaskList.tsx             ← NEW — <table> wrapper
│   │   ├── TaskRow.tsx              ← NEW — <tr> with overdue border, toggle, actions
│   │   ├── TaskForm.tsx             ← NEW — RHF + Zod form
│   │   ├── SortControls.tsx         ← NEW — sort-by select + direction toggle
│   │   └── CategoryPicker.tsx       ← NEW — chip-style category selector
│   ├── categories/
│   │   └── CategoryManager.tsx      ← NEW — inline CRUD list
│   └── shared/
│       ├── ConfirmDialog.tsx        ← NEW — Radix UI dialog wrapper
│       └── Pagination.tsx           ← NEW — basic (page 1 of 1 in UNIT-05)
├── components/ui/
│   ├── dialog.tsx                   ← NEW — shadcn/ui dialog (wraps @radix-ui/react-dialog)
│   └── select.tsx                   ← NEW — shadcn/ui select (wraps @radix-ui/react-select)
├── types/
│   └── api.ts                       ← MODIFIED — add TaskDto, CategoryDto, request types
└── App.tsx                          ← MODIFIED — add 4 new lazy routes
```

---

## Component Responsibilities

### `tasksApi` (RTK Query slice)
- `getTasks({ sortBy?, sortOrder? })` — `providesTags: ['Task', 'LIST']`
- `getTaskById(id)` — `providesTags: [{ type: 'Task', id }]`
- `createTask(body)` — `invalidatesTags: ['LIST']`
- `updateTask({ id, ...body })` — `invalidatesTags: [{ type: 'Task', id }, 'LIST']`
- `deleteTask(id)` — optimistic remove (Pattern 24) + `invalidatesTags: ['LIST']`
- `toggleTask(id)` — optimistic flip (Pattern 23) + `invalidatesTags: [{ type: 'Task', id }]`

### `categoriesApi` (RTK Query slice)
- `getCategories()` — `providesTags: ['Category']`
- `createCategory(body)` — `invalidatesTags: ['Category']`
- `updateCategory({ id, name })` — `invalidatesTags: ['Category']`
- `deleteCategory(id)` — `invalidatesTags: ['Category']`

### `uiSlice` (extended)
New state: `sortBy: string | null`, `sortOrder: 'asc' | 'desc'`
New actions: `setSortBy(payload)`, `setSortOrder(payload)`
New selectors: `selectSortBy`, `selectSortOrder`

### `DashboardPage`
- Reads `sortBy`, `sortOrder` from uiSlice
- Calls `useGetTasksQuery({ sortBy, sortOrder })`
- Renders: toolbar (SortControls + "New Task" button) → TaskList → Pagination
- Empty state when `items.length === 0`

### `TaskFormPage`
- `mode='create'`: empty form; on submit → `createTask` → navigate('/')
- `mode='edit'`: fetches task by `:id` param; pre-fills form; on submit → `updateTask` → navigate(`/tasks/${id}`)
- Renders `<TaskForm>` with handlers

### `TaskDetailPage`
- Fetches task by `:id` param
- 403/404 guard: Pattern 28 — redirects to `/` with toast
- Edit button → navigate to `/tasks/:id/edit`
- Delete button → opens `ConfirmDialog` → on confirm: `deleteTask` (optimistic) → navigate('/')
- Toggle completion button → `toggleTask` (optimistic)

### `CategoryManagementPage`
- Fetches categories via `useGetCategoriesQuery`
- Renders `<CategoryManager>`
- Back link to `/`

### `TaskList`
- Props: `{ tasks: TaskDto[]; isLoading: boolean }`
- Renders `<table>` with `<caption>`, `<thead>` (col headers with `scope="col"`), `<tbody>`
- Loading: spinner row spanning all columns
- Each task: `<TaskRow task={task} />`

### `TaskRow`
- Props: `{ task: TaskDto }`
- `<tr className={cn(task.isOverdue && 'border-l-4 border-red-500')}>` (Pattern — Q3:B)
- Completion checkbox → `toggleTask(task.id)` (Pattern 23)
- Title cell: `Link` to `/tasks/${task.id}`
- Priority badge: colored `<span>` (Low=gray, Medium=blue, High=red)
- Due date cell: formatted date string; visually dimmed if no date
- Actions: Edit icon → navigate to `/tasks/:id/edit`; Delete icon → ConfirmDialog

### `TaskForm`
- RHF `useForm({ resolver: zodResolver(taskSchema) })`
- Fields: title, description, priority select, dueDate date input (min=today), CategoryPicker
- Timezone auto-detected and injected at submit: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- `isSubmitting` prop controls button loading state

### `CategoryPicker`
- Props: `{ categories; value; onChange; maxSelected? }`
- Chip-toggle pattern (Pattern 27)
- Empty state: prompt to create categories via `/categories`

### `SortControls`
- Reads/dispatches `sortBy`, `sortOrder` from uiSlice
- `<Select>` for sortBy (uses shadcn/ui `select.tsx`)
- `<Button>` for direction (↑/↓, disabled when no sortBy)

### `ConfirmDialog`
- Props: `{ isOpen; title; message; onConfirm; onCancel; isLoading? }`
- Uses shadcn/ui `dialog.tsx` (Radix UI under the hood)
- Confirm button shows spinner when `isLoading`

### `CategoryManager`
- Inline create form at top
- Each category row: name (click to rename inline) + trash icon
- Delete → ConfirmDialog with "Tasks with this category will lose the tag but won't be deleted."

### `Pagination`
- Props: `{ currentPage; totalPages; onPageChange }`
- UNIT-05: renders nothing when `totalPages <= 1`
- UNIT-07: will be fully wired

---

## Data Flow — DashboardPage

```
uiSlice { sortBy, sortOrder }
    │
    ▼
DashboardPage
    │  useGetTasksQuery({ sortBy, sortOrder })
    │
    ▼
tasksApi cache → TaskList (table)
    │
    ├── TaskRow (per task)
    │     ├── toggle checkbox → tasksApi.toggleTask (Pattern 23)
    │     ├── title link → navigate('/tasks/:id')
    │     └── delete icon → ConfirmDialog → tasksApi.deleteTask (Pattern 24)
    │
    └── SortControls
          ├── sortBy select → dispatch(setSortBy)
          └── direction toggle → dispatch(setSortOrder)
```

## Data Flow — TaskFormPage (create)

```
TaskFormPage (mode='create')
    │  useGetCategoriesQuery()
    ▼
TaskForm (empty defaults)
    │  RHF + Zod validation
    ▼
Submit → tasksApi.createTask(body)
    │
    ├── success → invalidate 'LIST' → navigate('/') → toast "Task created"
    └── error   → field errors or toast
```
