# UNIT-04 Code Generation Plan — Backend: Task CRUD & Categories

**Unit**: UNIT-04: Backend — Task CRUD & Categories  
**Repository**: `todo-backend`  
**Workspace root**: `/home/adityawagh/awslabs-aidlc-demo`  
**Application code location**: `todo-backend/` (NEVER aidlc-docs/)

## Unit Context

**Dependencies**: UNIT-01 (Fastify scaffold, Prisma schema, Docker), UNIT-02 (AuthPlugin, errors.ts, prisma-client.ts)

**Stories implemented**: US-05, US-06 (basic list+sort), US-07, US-08, US-09, US-10, US-11, US-12, US-13, US-18 (task CRUD AC)

**Key schema note**: Existing `schema.prisma` uses `status: TaskStatus` enum (ACTIVE/COMPLETED) rather than `completed: boolean`. All code maps `status === 'COMPLETED'` → `completed: true` in DTOs.

**Files to modify** (existing stubs):
- `src/services/task.service.ts` — implement (stub only)
- `src/services/category.service.ts` — implement (stub only)
- `src/repositories/task.repository.ts` — implement (stub only)
- `src/repositories/category.repository.ts` — implement (stub only)
- `src/repositories/task-category.repository.ts` — implement (stub only)
- `src/controllers/tasks.controller.ts` — implement (stub only)
- `src/controllers/categories.controller.ts` — implement (stub only)
- `src/routes/tasks.routes.ts` — implement (stub only)
- `src/routes/categories.routes.ts` — implement (stub only)
- `src/domain/errors.ts` — extend ValidationError fields type
- `prisma/schema.prisma` — add citext + composite sort index

**Files to create** (new):
- `src/utils/sanitize.ts`
- `src/utils/date.ts`
- `src/services/category-validation.service.ts`
- `prisma/migrations/<timestamp>_add_citext_task_indexes/migration.sql`
- `tests/unit/task.service.test.ts`
- `tests/unit/category.service.test.ts`
- `tests/integration/tasks.test.ts`
- `tests/integration/categories.test.ts`
- `tests/property/tasks.property.test.ts`
- `aidlc-docs/construction/unit-04/code/summary.md`

---

## Execution Checklist

### Part A: Dependencies & Schema (Steps 1–3)
- [x] Step 1: Install `date-fns`, `date-fns-tz`, `he` + `@types/he` into `todo-backend/package.json`
- [x] Step 2: Update `prisma/schema.prisma` — add citext type to Category.name, add `@@unique([userId, name])` (replaces existing), add `@@index([userId, status, dueDate])` to Task
- [x] Step 3: Create Prisma migration `add_citext_task_indexes` with `CREATE EXTENSION IF NOT EXISTS citext`

### Part B: Utilities (Steps 4–5)
- [x] Step 4: Create `src/utils/sanitize.ts` — `sanitizeText()` and `sanitizeTextOrNull()` using `he.encode()`
- [x] Step 5: Create `src/utils/date.ts` — `isValidTimezone()`, `validateFutureDate()`, `computeIsOverdue()` using `date-fns` + `date-fns-tz`

### Part C: Domain Update (Step 6)
- [x] Step 6: Update `src/domain/errors.ts` — extend `ValidationError.fields` type to `Record<string, string | string[]>` to support per-ID category error arrays

### Part D: Repositories (Steps 7–9)
- [x] Step 7: Implement `src/repositories/task.repository.ts` — `findAll()` (with sort + NULLS LAST), `findById()` (includes categories), `create()`, `update()`, `delete()`
- [x] Step 8: Implement `src/repositories/category.repository.ts` — `findAllByUser()`, `findById()`, `findByNameAndUser()`, `create()`, `update()`, `delete()`
- [x] Step 9: Implement `src/repositories/task-category.repository.ts` — `setCategories()` (transaction), `findCategoriesForTask()`, `removeAllForCategory()`

### Part E: Services (Steps 10–12)
- [x] Step 10: Create `src/services/category-validation.service.ts` — `validateOwnership()` batch check
- [x] Step 11: Implement `src/services/task.service.ts` — all 6 methods + `toTaskDTO()` mapper (status→completed, isOverdue, Pattern 17–22)
- [x] Step 12: Implement `src/services/category.service.ts` — all 4 methods (citext-aware uniqueness check)

### Part F: Controllers & Routes (Steps 13–16)
- [x] Step 13: Implement `src/controllers/tasks.controller.ts` — 6 methods (listTasks, createTask, getTask, updateTask, deleteTask, toggleTask)
- [x] Step 14: Implement `src/controllers/categories.controller.ts` — 4 methods
- [x] Step 15: Implement `src/routes/tasks.routes.ts` — AJV schemas + route registration (GET/POST /tasks, GET/PUT/DELETE /tasks/:id, PATCH /tasks/:id/toggle)
- [x] Step 16: Implement `src/routes/categories.routes.ts` — AJV schemas + route registration

### Part G: Tests (Steps 17–21)
- [x] Step 17: Create `tests/unit/task.service.test.ts` — unit tests for TaskService (IDOR, completedAt write-once, isOverdue, validation)
- [x] Step 18: Create `tests/unit/category.service.test.ts` — unit tests for CategoryService (uniqueness, IDOR, cascade delete)
- [x] Step 19: Create `tests/integration/tasks.test.ts` — integration tests for all 6 task endpoints
- [x] Step 20: Create `tests/integration/categories.test.ts` — integration tests for all 4 category endpoints
- [x] Step 21: Create `tests/property/tasks.property.test.ts` — PBT for 7 invariants (PBT-TASK-01 through PBT-CAT-02)

### Part H: Documentation (Step 22)
- [x] Step 22: Create `aidlc-docs/construction/unit-04/code/summary.md`

---

## Story Traceability

| Story | Implemented By Steps |
|---|---|
| US-05 Create a Task | Steps 7, 9, 11, 13, 15 |
| US-06 View Task List (basic) | Steps 7, 11, 13, 15 |
| US-07 View Task Details | Steps 7, 11, 13, 15 |
| US-08 Edit a Task | Steps 7, 9, 11, 13, 15 |
| US-09 Delete a Task | Steps 7, 9, 11, 13, 15 |
| US-10 Toggle Completion | Steps 11, 13, 15 |
| US-11 Overdue Indicators | Steps 5, 11 |
| US-12 Manage Categories | Steps 8, 12, 14, 16 |
| US-13 Assign/Remove Tags | Steps 9, 11, 12 |
| US-18 REST API (task CRUD) | Steps 13, 15 |

**Total steps: 22 across 8 parts**
