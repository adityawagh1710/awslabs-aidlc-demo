# NFR Design Patterns — UNIT-04: Backend Task CRUD & Categories

All UNIT-01 patterns (fail-fast startup, fail-closed Redis, graceful shutdown, structured logging,
plugin registration order, security headers, Redis reconnect) and UNIT-02 patterns (constant-time
login, brute-force protection, refresh rotation, auth event emission, IDOR enforcement, email
normalisation) are inherited. This document adds UNIT-04-specific patterns only.

---

## Pattern 16 — XSS Prevention via `he` Encoding

**Applies to**: `TaskService` (title, description), `CategoryService` (name)

All free-text string inputs are HTML-entity-encoded at the service boundary before being passed
to the repository. This prevents stored XSS in the unlikely event the JSON API response is
rendered directly as HTML by a client.

```
Service method receives raw string input
    │
    ▼
sanitize(input.title)        // he.encode(str)
sanitize(input.description)  // he.encode(str) — if non-null
sanitize(input.name)         // he.encode(str) — categories
    │
    ▼
Encoded string written to DB
```

Centralised in `src/utils/sanitize.ts`:
```typescript
import he from 'he'

export function sanitizeText(value: string): string {
  return he.encode(value)
}

export function sanitizeTextOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  return he.encode(value)
}
```

Called at service layer only — controllers pass raw input through; repositories receive encoded output.

---

## Pattern 17 — Timezone-Aware Due Date Validation

**Applies to**: `TaskService.createTask()`, `TaskService.updateTask()`

When `dueDate` is provided, the server validates it is not in the past relative to the user's
local "today" (not UTC midnight). Requires a `timezone` field alongside `dueDate`.

```
Receive { dueDate: "2026-04-23", timezone: "America/New_York" }
    │
    ▼
isValidTimezone(timezone)          // date-fns-tz — rejects invalid IANA strings → 400
    │
    ▼
startOfTodayInTz = startOfDay(
  toZonedTime(new Date(), timezone) // convert server UTC now → user's local date
)
    │
    ▼
dueDateObj = parseISO(dueDate)     // parse "YYYY-MM-DD" as a local date
    │
    ▼
isBefore(dueDateObj, startOfTodayInTz)
    └── true  → throw ValidationError("Due date must be today or in the future")
    └── false → proceed with DB write
```

The parsed `dueDateObj` (Date object at UTC midnight of the given date) is stored in the DB.
The `isOverdue` computation uses UTC only — no timezone needed at read time.

---

## Pattern 18 — Category Ownership Pre-Write Guard

**Applies to**: `TaskService.createTask()`, `TaskService.updateTask()`

Before any task write that includes `categoryIds`, all IDs are validated as owned by the
requesting user in a single batch query. The entire request is rejected if any ID is invalid.

```
Receive categoryIds: ["id1", "id2", "id3"]
    │
    ▼
CategoryValidationService.validateOwnership(categoryIds, userId)
    │
    ├── DB: SELECT id FROM categories WHERE id IN (...) AND userId = ?
    ├── Compare returned IDs against requested IDs
    └── Collect missing or unowned IDs → invalidIds[]
    │
    ├── invalidIds.length > 0:
    │     throw ValidationError({
    │       categoryIds: invalidIds.map(id => `${id} is not a valid category`)
    │     })
    │
    └── All valid → proceed to task create/update
```

One query for up to 10 IDs — negligible overhead. Batch validation avoids N+1 per-ID checks.

---

## Pattern 19 — Write-Once `completedAt`

**Applies to**: `TaskService.toggleCompletion()`, `TaskService.updateTask()` (when `completed` provided)

`completedAt` records the first time a task was marked complete. It is set exactly once and
never updated or cleared, regardless of how many times the task is toggled.

```
Toggle or update with completed=true
    │
    ▼
task.completedAt === null?
    ├── YES → set completedAt = new Date()   // first completion
    └── NO  → leave completedAt unchanged    // preserve original
    │
    ▼
set completed = true

Toggle or update with completed=false (reopen)
    │
    ▼
set completed = false
completedAt → unchanged (NOT cleared)       // write-once semantics
```

At the repository level this translates to:
```typescript
await prisma.task.update({
  where: { id },
  data: {
    completed: true,
    // Only set completedAt if it has never been set
    ...(task.completedAt == null ? { completedAt: new Date() } : {}),
  }
})
```

---

## Pattern 20 — Compound Default Sort with NULLS LAST

**Applies to**: `TaskRepository.findAll()`

The default task list sort (US-06) places incomplete tasks before complete, then by due date
ascending with null dates at the end. This requires a compound ORDER BY clause.

```sql
-- Default sort (no sortBy param):
ORDER BY completed ASC, due_date ASC NULLS LAST

-- Custom sort (sortBy provided):
ORDER BY <sortBy> <sortOrder> NULLS LAST, id ASC  -- id as stable tie-breaker
```

Prisma does not support `NULLS LAST` natively in `orderBy`. Use `Prisma.$queryRaw` or
the `prisma-extension-order-by-nulls` approach, or use raw `ORDER BY` in a `findRaw`-style
query. Preferred: `$queryRawUnsafe` with typed result + Zod parse, or Prisma's upcoming
native NULLS LAST support.

**Selected approach**: Prisma `orderBy` with `sort: 'asc', nulls: 'last'` — available in
Prisma 4.1+ as `{ dueDate: { sort: 'asc', nulls: 'last' } }`. Prisma 6 supports this natively.

---

## Pattern 21 — Atomic Category Set Replacement

**Applies to**: `TaskCategoryRepository.setCategories()`

When categories are updated on a task, the full set is replaced atomically to avoid partial
states (e.g., new categories added but old ones not removed, or vice versa).

```
setCategories(taskId, categoryIds)
    │
    ▼
prisma.$transaction([
  prisma.taskCategory.deleteMany({ where: { taskId } }),
  prisma.taskCategory.createMany({
    data: categoryIds.map(categoryId => ({ taskId, categoryId })),
    skipDuplicates: true,
  }),
])
```

If the transaction fails (e.g., FK violation), neither delete nor insert is committed —
the task retains its original categories.

---

## Pattern 22 — `isOverdue` Server-Side Computation

**Applies to**: Task-to-DTO mapping in `TaskService` (all read paths)

`isOverdue` is computed at serialization time using the server's UTC clock. It is never stored.

```typescript
function computeIsOverdue(task: Task, now: Date): boolean {
  if (task.dueDate === null) return false
  if (task.completed) return false
  // Due today (UTC) is NOT overdue — only strictly past dates
  const startOfToday = startOfDay(now)  // UTC midnight
  return task.dueDate < startOfToday
}
```

`now` is injected (not `new Date()` inline) to keep the function pure and easily testable.
Applied in a `toTaskDTO(task, now)` mapper function called on every read path.
