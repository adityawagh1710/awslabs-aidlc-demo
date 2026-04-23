# Domain Entities — UNIT-05: Frontend Task CRUD & Categories UI

## API Types (additions to `src/types/api.ts`)

```typescript
// ── Task types ──────────────────────────────────────────────────────────────

export type Priority = 'Low' | 'Medium' | 'High'

export interface CategoryDto {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface TaskDto {
  id: string
  title: string
  description: string | null
  priority: Priority
  dueDate: string | null        // 'YYYY-MM-DD' or null
  completed: boolean
  completedAt: string | null    // ISO datetime or null
  isOverdue: boolean            // computed server-side
  categories: CategoryDto[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedTasksDto {
  items: TaskDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string              // 'YYYY-MM-DD'
  timezone?: string             // IANA tz, required when dueDate provided
  categoryIds?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string | null
  priority?: Priority
  dueDate?: string | null
  timezone?: string
  categoryIds?: string[]
  completed?: boolean
}

export interface CreateCategoryRequest {
  name: string
}

export interface UpdateCategoryRequest {
  name: string
}
```

---

## RTK Query API Slices (new files)

### `src/store/api/tasksApi.ts`

```typescript
export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<PaginatedTasksDto, { sortBy?: string; sortOrder?: string }>({
      query: (params) => ({ url: '/tasks', params }),
      providesTags: (result) => result
        ? [...result.items.map(({ id }) => ({ type: 'Task' as const, id })), { type: 'Task', id: 'LIST' }]
        : [{ type: 'Task', id: 'LIST' }],
      // Optimistic toggle and delete handled via onQueryStarted in mutations
    }),
    getTaskById: builder.query<TaskDto, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation<TaskDto, CreateTaskRequest>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: builder.mutation<TaskDto, { id: string } & UpdateTaskRequest>({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Task', id }, { type: 'Task', id: 'LIST' }],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      // Optimistic update in onQueryStarted; invalidate on error recovery
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    toggleTask: builder.mutation<TaskDto, string>({
      query: (id) => ({ url: `/tasks/${id}/toggle`, method: 'PATCH' }),
      // Optimistic update in onQueryStarted
      invalidatesTags: (_r, _e, id) => [{ type: 'Task', id }],
    }),
  }),
})
```

### `src/store/api/categoriesApi.ts`

```typescript
export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Category'],
  endpoints: (builder) => ({
    getCategories: builder.query<CategoryDto[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<CategoryDto, CreateCategoryRequest>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<CategoryDto, { id: string; name: string }>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
  }),
})
```

---

## Redux Store Updates

### `uiSlice` additions (sort state)

```typescript
// New fields added to UiState:
interface UiState {
  returnTo: string | null
  toasts: Toast[]
  // UNIT-05 additions:
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title' | null
  sortOrder: 'asc' | 'desc'
}

// New actions:
setSortBy(state, action: PayloadAction<UiState['sortBy']>): void
setSortOrder(state, action: PayloadAction<'asc' | 'desc'>): void

// New selectors:
selectSortBy: (state: RootState) => state.ui.sortBy
selectSortOrder: (state: RootState) => state.ui.sortOrder
```

### `store/index.ts` additions

```typescript
// Add tasksApi and categoriesApi reducers and middleware:
reducer: {
  auth: authReducer,
  ui: uiReducer,
  [authApi.reducerPath]: authApi.reducer,
  [tasksApi.reducerPath]: tasksApi.reducer,      // new
  [categoriesApi.reducerPath]: categoriesApi.reducer,  // new
},
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware()
    .concat(authApi.middleware)
    .concat(tasksApi.middleware)          // new
    .concat(categoriesApi.middleware),    // new
```

---

## Zod Form Schemas

### Task form schema (`src/components/tasks/TaskForm.tsx`)

```typescript
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or fewer'),
  description: z.string().max(2000, 'Description must be 2000 characters or fewer').optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueDate: z.string().optional().refine(
    (val) => !val || new Date(val) >= startOfToday(),
    'Due date must be today or in the future',
  ),
  categoryIds: z.array(z.string()).max(10).default([]),
})
```

### Category form schema

```typescript
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or fewer'),
})
```

---

## New Routes (additions to `App.tsx`)

```tsx
<Route path="/tasks/new" element={<TaskFormPage mode="create" />} />
<Route path="/tasks/:id" element={<TaskDetailPage />} />
<Route path="/tasks/:id/edit" element={<TaskFormPage mode="edit" />} />
<Route path="/categories" element={<CategoryManagementPage />} />
```

All nested under existing `<ProtectedRoute>` → `<AppShell>`.
