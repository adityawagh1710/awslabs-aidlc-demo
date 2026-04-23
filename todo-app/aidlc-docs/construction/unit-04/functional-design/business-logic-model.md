# Business Logic Model — UNIT-04: Backend Task CRUD & Categories

## Overview

UNIT-04 implements the core task and category management domain for a single authenticated user. All operations are strictly scoped to the requesting user's data. IDOR enforcement runs on every task and category access.

---

## Flow 1: Create Task

```
Client → POST /api/v1/tasks
1. Validate JWT (AuthPlugin) → extract user.id
2. Validate request body:
   a. title: required, max 255 chars, strip/escape HTML
   b. description: optional, max 2000 chars, strip/escape HTML
   c. priority: optional (default: 'Medium'), must be 'Low'|'Medium'|'High'
   d. dueDate: optional ISO date string (YYYY-MM-DD)
   e. timezone: required IF dueDate provided; must be valid IANA timezone string
   f. categoryIds: optional array, max 10 items
3. If dueDate provided:
   a. Parse dueDate in user's timezone
   b. Compare to start-of-today in that timezone
   c. Reject if dueDate < today (400)
4. If categoryIds provided:
   a. Load all categories by IDs from DB (for this user)
   b. Find any IDs that are missing or belong to another user
   c. If any invalid IDs found → return 400 with field-level error listing each bad ID
5. Create task in DB with: userId=user.id, completed=false, completedAt=null
6. Atomically set task_category associations (setCategories)
7. Load task with categories from DB
8. Compute isOverdue (always false for new task — dueDate cannot be in the past)
9. Return 201 with TaskDTO
```

---

## Flow 2: List Tasks (Basic — no search/filter/pagination)

```
Client → GET /api/v1/tasks[?sortBy=&sortOrder=]
1. Validate JWT → extract user.id
2. Parse optional sort query params:
   sortBy: 'dueDate'|'priority'|'createdAt'|'title' (default: compound default)
   sortOrder: 'asc'|'desc' (default: 'asc')
3. Default sort (when no sortBy specified):
   ORDER BY completed ASC, dueDate ASC NULLS LAST
4. Custom sort:
   ORDER BY <sortBy> <sortOrder> NULLS LAST, id ASC (tie-breaker)
5. TaskRepository.findAll(userId, {}, { page: 1, pageSize: 9999 })
   → returns { tasks: Task[], total: number }
6. For each task: compute isOverdue
7. Return 200 with paginated wrapper:
   { items: TaskDTO[], total, page: 1, pageSize: total, totalPages: 1 }
   (UNIT-06 will extend query params to add real pagination)
```

---

## Flow 3: Get Task (Single)

```
Client → GET /api/v1/tasks/:id
1. Validate JWT → extract user.id
2. TaskRepository.findById(id)
   a. If not found → 404
   b. If task.userId !== user.id → 403 (never 404, per US-07 — prevents enumeration)
3. Load task categories
4. Compute isOverdue
5. Return 200 with TaskDTO
```

---

## Flow 4: Update Task

```
Client → PUT /api/v1/tasks/:id
1. Validate JWT → extract user.id
2. TaskRepository.findById(id)
   a. If not found → 404
   b. If task.userId !== user.id → 403
3. Validate request body (same rules as create; all fields optional):
   a. title (if provided): max 255, escape HTML
   b. description (if provided): max 2000, escape HTML; null clears it
   c. priority (if provided): valid enum
   d. dueDate (if provided): ISO date or null; if non-null, timezone required; validate future
   e. categoryIds (if provided): max 10; validate all owned by user (→ 400 if any invalid)
   f. completed (if provided): boolean; apply toggle rules (see Flow 6)
4. Apply partial update — only modify provided fields
5. Update updatedAt timestamp
6. If categoryIds provided: atomically replace all task_category associations
7. If completed provided and task is transitioning incomplete→complete:
   a. Set completedAt = now (only if completedAt is currently null — preserves first completion)
8. Return 200 with updated TaskDTO
```

---

## Flow 5: Delete Task

```
Client → DELETE /api/v1/tasks/:id
1. Validate JWT → extract user.id
2. TaskRepository.findById(id)
   a. If not found → 404
   b. If task.userId !== user.id → 403
3. In a single DB transaction:
   a. Delete all task_category entries for this task
   b. Delete the task record
4. Return 204 No Content
```

---

## Flow 6: Toggle Task Completion (PATCH endpoint)

```
Client → PATCH /api/v1/tasks/:id/toggle
1. Validate JWT → extract user.id
2. TaskRepository.findById(id)
   a. If not found → 404
   b. If task.userId !== user.id → 403
3. Flip completed: !task.completed
4. If transitioning false → true AND task.completedAt is null:
   a. Set completedAt = now  (first completion — Q3:A: never updated again)
5. If transitioning true → false:
   a. Do NOT modify completedAt (preserve original first-completion timestamp — Q3:A)
6. Return 200 with updated TaskDTO
```

---

## Flow 7: List Categories

```
Client → GET /api/v1/categories
1. Validate JWT → extract user.id
2. CategoryRepository.findAllByUser(userId)
3. Return 200 with CategoryDTO[]
```

---

## Flow 8: Create Category

```
Client → POST /api/v1/categories
1. Validate JWT → extract user.id
2. Validate body:
   a. name: required, max 50 chars, escape HTML
3. CategoryRepository.findByNameAndUser(name, userId) — case-insensitive (Q4:A)
   a. If found → 400: "You already have a category with this name"
4. CategoryRepository.create({ userId, name })
5. Return 201 with CategoryDTO
```

---

## Flow 9: Update Category

```
Client → PUT /api/v1/categories/:id
1. Validate JWT → extract user.id
2. CategoryRepository.findById(id)
   a. If not found → 404
   b. If category.userId !== user.id → 403
3. Validate body:
   a. name: required, max 50 chars, escape HTML
4. CategoryRepository.findByNameAndUser(name, userId) — case-insensitive
   a. If found AND result.id !== id → 400: "You already have a category with this name"
5. CategoryRepository.update(id, { name })
6. Return 200 with CategoryDTO
```

---

## Flow 10: Delete Category

```
Client → DELETE /api/v1/categories/:id
1. Validate JWT → extract user.id
2. CategoryRepository.findById(id)
   a. If not found → 404
   b. If category.userId !== user.id → 403
3. In a single DB transaction:
   a. TaskCategoryRepository.removeAllForCategory(id) — removes join records only; tasks NOT deleted
   b. CategoryRepository.delete(id)
4. Return 204 No Content
```

---

## isOverdue Computation (server-side, per US-11)

```
isOverdue(task: Task, serverNow: Date): boolean {
  if (task.dueDate === null) return false
  if (task.completed === true) return false
  // "due today" is NOT overdue — only strictly past dates count (US-11)
  const startOfToday = startOfDay(serverNow)  // UTC midnight
  return task.dueDate < startOfToday
}
```

**Note**: `serverNow` is injected at request time (UTC). The timezone used for due date _validation_ (Q1:B) is the user's submitted timezone, but `isOverdue` is computed in UTC per US-11 ("server's date at request time").
