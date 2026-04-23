# NFR Design Patterns — UNIT-05: Frontend Task CRUD & Categories UI

All UNIT-03 patterns inherited (token-in-memory, baseQueryWithReauth, PersistAuth, ErrorBoundary).
This document adds UNIT-05-specific patterns only.

---

## Pattern 23 — Optimistic Toggle with RTK Query Patch + Undo

**Applies to**: `tasksApi.toggleTask` mutation

Toggle completion must appear instant (0 ms perceived latency). RTK Query's `onQueryStarted`
applies a cache patch before the request, rolling back on failure.

```typescript
toggleTask: builder.mutation<TaskDto, string>({
  query: (id) => ({ url: `/tasks/${id}/toggle`, method: 'PATCH' }),
  async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
    // Patch the LIST cache
    const listPatch = dispatch(
      tasksApi.util.updateQueryData('getTasks', selectSortArgs(getState()), (draft) => {
        const task = draft.items.find((t) => t.id === id)
        if (task) task.completed = !task.completed
      }),
    )
    // Patch the DETAIL cache if present
    const detailPatch = dispatch(
      tasksApi.util.updateQueryData('getTaskById', id, (draft) => {
        draft.completed = !draft.completed
      }),
    )
    try {
      const { data } = await queryFulfilled
      // Overwrite with authoritative server response (captures completedAt, isOverdue)
      dispatch(
        tasksApi.util.updateQueryData('getTasks', selectSortArgs(getState()), (draft) => {
          const task = draft.items.find((t) => t.id === id)
          if (task) Object.assign(task, data)
        }),
      )
    } catch {
      listPatch.undo()
      detailPatch.undo()
      dispatch(addToast({ title: 'Failed to update task', variant: 'destructive' }))
    }
  },
})
```

---

## Pattern 24 — Optimistic Delete with RTK Query Patch + Undo

**Applies to**: `tasksApi.deleteTask` mutation

Deleting a task should feel instant. The task is removed from the list cache immediately.

```typescript
deleteTask: builder.mutation<void, string>({
  query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
  async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
    const patch = dispatch(
      tasksApi.util.updateQueryData('getTasks', selectSortArgs(getState()), (draft) => {
        draft.items = draft.items.filter((t) => t.id !== id)
        draft.total = Math.max(0, draft.total - 1)
      }),
    )
    try {
      await queryFulfilled
    } catch {
      patch.undo()
      dispatch(addToast({ title: 'Failed to delete task', variant: 'destructive' }))
    }
  },
  invalidatesTags: [{ type: 'Task', id: 'LIST' }],
})
```

---

## Pattern 25 — Route Lazy Loading with Suspense

**Applies to**: `App.tsx` — TaskFormPage, TaskDetailPage, CategoryManagementPage

New pages are code-split to keep the initial bundle within the 200 KB UNIT-03 target.

```tsx
const TaskFormPage = React.lazy(() =>
  import('./pages/TaskFormPage').then((m) => ({ default: m.TaskFormPage })),
)
const TaskDetailPage = React.lazy(() =>
  import('./pages/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })),
)
const CategoryManagementPage = React.lazy(() =>
  import('./pages/CategoryManagementPage').then((m) => ({ default: m.CategoryManagementPage })),
)

// Wrapped in route:
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/tasks/new" element={<TaskFormPage mode="create" />} />
</Suspense>
```

DashboardPage is NOT lazy — it is the root authenticated route and loads with the initial chunk.

---

## Pattern 26 — RTK Query Cache Reset on Logout

**Applies to**: `authSlice` `clearCredentials` action + store middleware

When a user logs out, all task and category caches must be purged to prevent a subsequent
login (different user) from seeing stale data.

```typescript
// In authSlice extraReducers or a store middleware:
listenerMiddleware.startListening({
  actionCreator: clearCredentials,
  effect: (_action, { dispatch }) => {
    dispatch(tasksApi.util.resetApiState())
    dispatch(categoriesApi.util.resetApiState())
  },
})
```

---

## Pattern 27 — CategoryPicker Max-Selection Guard

**Applies to**: `CategoryPicker` component

When exactly 10 categories are selected, unselected chips must be visually disabled
to prevent exceeding the backend limit. This is enforced purely in the component —
the Zod schema also catches it at form submit for defence-in-depth.

```typescript
const isMaxReached = value.length >= (maxSelected ?? 10)

// Per chip:
<button
  type="button"
  disabled={isMaxReached && !value.includes(cat.id)}
  className={cn(
    'rounded-full border px-3 py-1 text-sm transition-colors',
    value.includes(cat.id)
      ? 'bg-primary text-primary-foreground'
      : isMaxReached
        ? 'cursor-not-allowed opacity-50'
        : 'hover:bg-muted',
  )}
  onClick={() => handleToggle(cat.id)}
>
  {cat.name}
</button>
```

---

## Pattern 28 — 403/404 Guard on Task Detail Navigation

**Applies to**: `TaskDetailPage`

If the backend returns 403 or 404 for `GET /tasks/:id`, the user should not see an error
page — they should be silently redirected to `/` with an informative toast.

```typescript
const { data: task, error, isLoading } = useGetTaskByIdQuery(id!)

useEffect(() => {
  if (error) {
    const status = (error as FetchBaseQueryError).status
    if (status === 404) {
      dispatch(addToast({ title: 'Task not found', variant: 'destructive' }))
    } else if (status === 403) {
      dispatch(addToast({ title: 'Access denied', variant: 'destructive' }))
    } else {
      dispatch(addToast({ title: 'Failed to load task', variant: 'destructive' }))
    }
    navigate('/')
  }
}, [error, navigate, dispatch])
```
