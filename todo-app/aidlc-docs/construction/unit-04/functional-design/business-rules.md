# Business Rules — UNIT-04: Backend Task CRUD & Categories

## Task Rules

### BR-T-01: Title — Required, max length
- Title is required on task creation
- Max length: 255 characters
- Violation response: 400 `{ "error": "ValidationError", "fields": { "title": "Title is required" | "Title must be 255 characters or fewer" } }`

### BR-T-02: Description — Optional, max length
- Description is optional (null if not provided)
- Max length: 2000 characters
- Violation response: 400 with field-level message

### BR-T-03: Priority — Enum with default
- Valid values: `'Low'`, `'Medium'`, `'High'`
- Default when not provided: `'Medium'`
- Invalid value: 400 with field-level message

### BR-T-04: Due date — Today or future in user's timezone
- If `dueDate` is provided, `timezone` must also be provided (IANA format, e.g., `"America/New_York"`)
- Server computes start-of-today in the supplied timezone and compares
- `dueDate < startOfToday(timezone)` → 400: `"Due date must be today or in the future"`
- If timezone is invalid IANA string → 400: `"timezone must be a valid IANA timezone identifier"`
- If `dueDate` is null on update → clears the due date (allowed)

### BR-T-05: XSS prevention on title and description
- Title and description HTML is escaped before persisting
- Applies on both create and update

### BR-T-06: `isOverdue` computed at request time (UTC)
- `isOverdue = dueDate !== null AND completed === false AND dueDate < startOfDay(serverNow UTC)`
- A task due _today_ (UTC) is NOT overdue — only strictly past-day dates count (US-11)
- `isOverdue` is never stored; always recomputed on read

### BR-T-07: IDOR — Task ownership enforcement
- Every task read/write checks `task.userId === request.user.id`
- Task not found: 404
- Task found but owned by another user: 403 (not 404 — prevents ID enumeration, per US-07)

### BR-T-08: Owner set server-side
- `userId` is always taken from the JWT, never from the request body
- A client cannot assign a task to a different user

### BR-T-09: `completedAt` — First-completion-only semantics (Q3:A)
- When a task transitions `completed: false → true` for the first time: `completedAt = now`
- When `completedAt` is already set (task was previously completed), re-completing does NOT update `completedAt`
- Reopening a completed task (toggle to incomplete) does NOT clear `completedAt`
- Net: `completedAt` records the _first_ time a task was completed; it is write-once

### BR-T-10: Maximum categories per task (Q7:B)
- A task may have at most **10** categories assigned
- Violation on create or update: 400 `{ "error": "ValidationError", "fields": { "categoryIds": "A task can have at most 10 categories" } }`

### BR-T-11: Category ownership validation on task create/update (Q6:C)
- All `categoryIds` in the request must exist AND belong to the requesting user
- If any ID is not found or owned by another user → 400 with field-level error listing each invalid ID:
  ```json
  {
    "error": "ValidationError",
    "fields": {
      "categoryIds": ["<id1> is not a valid category", "<id2> is not a valid category"]
    }
  }
  ```
- The entire operation is rejected (no partial application)

### BR-T-12: Task deletion cascade
- Deleting a task removes all `task_category` join records for that task in the same transaction
- No orphaned join records remain after deletion

### BR-T-13: Tasks without due date sort last (Q5:A)
- In any ascending sort by due date: tasks with `dueDate = null` appear after all tasks with a due date
- SQL: `ORDER BY dueDate ASC NULLS LAST`

### BR-T-14: Default sort order (US-06)
- When no `sortBy` is specified: `ORDER BY completed ASC, dueDate ASC NULLS LAST`
- Incomplete tasks (completed=false) appear before complete tasks

### BR-T-15: Toggle completion via PATCH endpoint (Q8:C)
- `PATCH /api/v1/tasks/:id/toggle` flips `completed` atomically
- Applies completedAt write-once rule (BR-T-09)
- Returns 200 with updated TaskDTO

### BR-T-16: Completion via PUT endpoint (Q8:C)
- `PUT /api/v1/tasks/:id` may include `completed: boolean` in the body
- When provided, applies the same toggle semantics and completedAt write-once rule
- The `completed` field in PUT is optional; if omitted, completion status is unchanged

---

## Category Rules

### BR-C-01: Category name — Required, max length
- Name is required; max 50 characters
- Violation: 400 with field-level message

### BR-C-02: Category name uniqueness — Case-insensitive per user (Q4:A)
- `(LOWER(name), userId)` must be unique
- "Work", "work", "WORK" are all treated as the same name for the same user
- Violation: 400: `"You already have a category with this name"`
- Check applied on both create and update (excluding self on update)

### BR-C-03: IDOR — Category ownership enforcement
- Every category read/write checks `category.userId === request.user.id`
- Not found: 404; wrong owner: 403

### BR-C-04: Category deletion — disassociate, don't cascade-delete tasks
- Deleting a category removes all `task_category` entries for that category
- Tasks previously assigned that category are unaffected (they lose the association; they are not deleted)

### BR-C-05: Category name XSS prevention
- Category names are escaped before persisting and on display

### BR-C-06: Cross-user category isolation
- `GET /api/v1/categories` returns only categories belonging to the authenticated user
- No category belonging to another user is ever included in any response

---

## Property-Based Test (PBT) Invariants

| ID | Property | Description |
|---|---|---|
| PBT-TASK-01 | User isolation | `listTasks(userId)` never includes a task with `task.userId !== userId` |
| PBT-TASK-02 | Toggle idempotence | `toggle(id)` then `toggle(id)` returns task to original `completed` value |
| PBT-TASK-03 | Delete count | Deleting one task decreases `total` in subsequent `listTasks` by exactly 1 |
| PBT-TASK-04 | Title max-length | Creating a task with title of exactly 255 chars succeeds; 256 chars fails with 400 |
| PBT-TASK-05 | Category ownership | No task in the system ever has a `task_category` entry pointing to a category owned by a different user |
| PBT-CAT-01 | Category uniqueness | Creating two categories with names that differ only by case for the same user always fails on the second with 400 |
| PBT-CAT-02 | Category delete isolation | Deleting a category never deletes any task; only removes join records |
