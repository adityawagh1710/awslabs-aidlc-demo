# Business Rules — UNIT-05: Frontend Task CRUD & Categories UI

## Task Form Validation Rules

### BR-F-01: Title — Required, max length
- Zod schema: `z.string().min(1, "Title is required").max(255, "Title must be 255 characters or fewer")`
- Inline error message shown below field on blur and on submit attempt

### BR-F-02: Description — Optional, max length
- Zod schema: `z.string().max(2000, "Description must be 2000 characters or fewer").optional()`

### BR-F-03: Priority default
- Default value in RHF: `'Medium'`
- Select options: Low / Medium / High

### BR-F-04: Due date — Today or future (client-side pre-check)
- Client validates `dueDate >= startOfToday` in user's browser timezone before submitting
- Error message: "Due date must be today or in the future"
- Server also validates (authoritative); client check reduces round-trips
- Due date field uses `type="date"` input; min attribute set to today dynamically

### BR-F-05: Category limit
- Max 10 categories per task enforced in CategoryPicker
- When 10 are selected, unselected chips become visually disabled (opacity-50, pointer-events-none)
- Zod schema: `z.array(z.string()).max(10).optional()`

---

## Task List Display Rules

### BR-F-06: Overdue row indicator (Q3:B)
- A task row with `isOverdue === true` receives a red left-border accent: `border-l-4 border-red-500`
- Applied to the `<tr>` element in TaskList table
- No additional text badge or "Overdue" label

### BR-F-07: Completed task visual treatment
- Completed task row: title has `line-through` + `text-muted-foreground` styling
- Completion checkbox appears checked/filled
- `isOverdue` is always `false` for completed tasks (server guarantee)

### BR-F-08: Empty state
- When task list is empty: "No tasks yet. Create your first task!" with a "New Task" button
- When 0 tasks after sort change: same empty state (sort parameters are preserved in URL/Redux)

---

## Optimistic Update Rules

### BR-F-09: Toggle completion — optimistic (Q2:A)
- RTK Query `onQueryStarted`: immediately update `completed` in `getTasks` cache and `getTaskById` cache
- On server success: overwrite with server response (captures updated `completedAt`, `isOverdue`)
- On server error: `patchResult.undo()` + error toast "Failed to update task"

### BR-F-10: Delete task — optimistic (Q2:A)
- RTK Query `onQueryStarted`: immediately remove task from `getTasks` cache
- On server success: no further action needed (task already removed from cache)
- On server error: `patchResult.undo()` + error toast "Failed to delete task"
- If user is on TaskDetailPage when delete succeeds: `navigate('/')`

---

## Category Form Validation Rules

### BR-F-11: Category name — Required, max 50 chars
- Zod schema: `z.string().min(1, "Name is required").max(50, "Name must be 50 characters or fewer")`
- Inline validation in CategoryManager's inline create/rename form

### BR-F-12: Delete category confirmation
- ConfirmDialog message: "Delete '[name]'? Tasks with this category will lose the tag but won't be deleted."
- On confirm: `useDeleteCategoryMutation(id)` + success toast
- On error: error toast

---

## Navigation Rules

### BR-F-13: Post-create navigation
- After successful task creation: navigate to `/` (dashboard)

### BR-F-14: Post-edit navigation
- After successful task edit: navigate to `/tasks/:id` (detail view)

### BR-F-15: Back navigation
- TaskDetailPage and TaskFormPage both show a "← Back" link
- TaskDetailPage: back to `/`
- TaskFormPage (create): back to `/`
- TaskFormPage (edit): back to `/tasks/:id`

### BR-F-16: Route protection
- All new routes (`/tasks/*`, `/categories`) are nested under existing `<ProtectedRoute>`

---

## PBT Invariants (Frontend)

| ID | Property | Description |
|---|---|---|
| PBT-CLIENT-04 | Optimistic toggle idempotence | Two optimistic toggles restore original `completed` value in cache |
| PBT-CLIENT-05 | Sort state preservation | Changing sortOrder does not reset sortBy; changing sortBy does not reset sortOrder to default |
| PBT-CLIENT-06 | Category chip max enforcement | Selecting 10 chips disables all remaining; deselecting one re-enables the rest |
| PBT-CLIENT-07 | Form validation completeness | Any title > 255 chars always produces a validation error before submission |
