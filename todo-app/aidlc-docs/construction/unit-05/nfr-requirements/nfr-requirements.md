# NFR Requirements — UNIT-05: Frontend Task CRUD & Categories UI

## Performance

All UNIT-03 performance targets inherited. UNIT-05 additions:

| Requirement | Target | Enforcement |
|---|---|---|
| New page routes — lazy loading | Page chunks each < 50 KB gzipped | `React.lazy` + `<Suspense>` for TaskFormPage, TaskDetailPage, CategoryManagementPage — keeps initial bundle at UNIT-03 target |
| Task table render | < 16 ms for up to 500 rows | No virtualization for UNIT-05 (< 500 tasks); plain `<table>` with no expensive transforms |
| RTK Query cache hit | 0 additional network requests on navigation between task list and detail | `providesTags`/`invalidatesTags` correctly scoped so re-navigating to `/tasks/:id` uses cached data |
| Optimistic update latency | 0 ms perceived latency for toggle/delete | Patch applied synchronously in `onQueryStarted`; no loading spinner shown |

---

## Security

All UNIT-03 security requirements inherited. UNIT-05 additions:

| Requirement | Implementation |
|---|---|
| User data isolation (display) | `getTasks` and `getCategories` RTK Query endpoints never cache data across users; on logout `authApi.util.resetApiState()` called to clear all RTK Query caches |
| XSS in task/category display | Task title, description, category names are rendered as text nodes (React default JSX escaping) — never with `dangerouslySetInnerHTML` |
| Due date client validation | `min` attribute on date input + Zod `refine` prevents past-date submission; server is authoritative (defence-in-depth) |
| IDOR prevention (client) | RTK Query cache keyed by task ID; 403 responses clear that task from cache and redirect to `/` |

---

## Reliability

All UNIT-03 reliability requirements inherited. UNIT-05 additions:

| Requirement | Implementation |
|---|---|
| Optimistic rollback | `patchResult.undo()` called in `catch` block of `onQueryStarted` for toggle and delete mutations |
| 403/404 on task detail | `useGetTaskByIdQuery` — on 403 or 404 response: show error toast + `navigate('/')` |
| Category fetch failure in TaskForm | If `useGetCategoriesQuery` fails: CategoryPicker shows error state; form still submittable with no categories |
| Navigation loss prevention | No unsaved-changes prompt for MVP (out of scope); form state is local — navigating away loses draft |

---

## Accessibility (best-effort, inherited from UNIT-03)

| Requirement | Implementation |
|---|---|
| Task table | `<caption>` with "My Tasks"; `<th scope="col">` on all headers; `<tr>` role preserved |
| ConfirmDialog | Radix UI `Dialog` provides focus trap + `role="alertdialog"` + `aria-labelledby` automatically |
| SortControls | `<Select>` uses Radix UI with keyboard navigation; direction button has `aria-label="Sort direction"` |
| OverdueBadge (row border) | Additional `aria-label` or visually-hidden text "overdue" on due date cell for screen readers |
| Completion toggle | `<input type="checkbox">` with associated `<label>` for screen reader accessibility |

---

## New npm Dependencies

| Package | Purpose |
|---|---|
| `@radix-ui/react-dialog` | ConfirmDialog (shadcn/ui dialog component wrapper) |
| `@radix-ui/react-select` | SortControls sort-by dropdown (shadcn/ui select component wrapper) |

Both are Radix UI primitives — zero runtime overhead beyond what's already present (Radix UI pattern already in use for label, slot, toast).
