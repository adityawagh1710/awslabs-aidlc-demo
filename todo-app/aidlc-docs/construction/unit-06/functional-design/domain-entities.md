# Domain Entities — UNIT-06: Backend Search, Filter & Pagination

## New / Extended TypeScript Interfaces

### TaskFilters (new — replaces empty `{}` in UNIT-04 listTasks)

```typescript
export interface TaskFilters {
  search?: string                            // FTS via plainto_tsquery; empty = no filter
  status?: 'active' | 'completed' | 'all'   // 'all' = no filter; absent = no filter
  priority?: Array<'Low' | 'Medium' | 'High'>
  categoryIds?: string[]
  dueDateFrom?: Date                         // inclusive: due_date >= dueDateFrom
  dueDateTo?: Date                           // exclusive: due_date < dueDateTo
}
```

### PaginationInput (new)

```typescript
export interface PaginationInput {
  page: number       // 1-based, default 1
  pageSize: number   // 1–50, default 25
}
```

### TaskListInput (new — combines all listTasks parameters)

```typescript
export interface TaskListInput {
  filters: TaskFilters
  pagination: PaginationInput
  sort: TaskSortInput   // existing from UNIT-04
}
```

---

## Updated Method Signatures

### TaskRepository.findAll (extended)

```typescript
// BEFORE (UNIT-04):
findAll(userId: string, sort: TaskSortInput): Promise<{ tasks: TaskWithCategories[]; total: number }>

// AFTER (UNIT-06):
findAll(
  userId: string,
  filters: TaskFilters,
  pagination: PaginationInput,
  sort: TaskSortInput,
): Promise<{ tasks: TaskWithCategories[]; total: number }>
```

Note: `findAll` will use `prisma.$queryRaw` for FTS search queries, falling back to
`prisma.task.findMany` for non-search queries (maintains type safety where possible).

### TaskService.listTasks (extended)

```typescript
// BEFORE (UNIT-04):
listTasks(userId: string, sort: TaskSortInput): Promise<PaginatedTasksDTO>

// AFTER (UNIT-06):
listTasks(userId: string, input: TaskListInput): Promise<PaginatedTasksDTO>
```

---

## New DB Schema (migration required)

```sql
-- Add FTS generated column (stored for GIN index efficiency)
ALTER TABLE "Task"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  ) STORED;

-- GIN index for full-text search performance
CREATE INDEX "tasks_search_vector_gin_idx" ON "Task" USING GIN ("search_vector");

-- Additional filter indexes (for status+userId and priority+userId queries)
CREATE INDEX "Task_userId_priority_status_idx" ON "Task" ("userId", priority, status);
```

Note: Prisma schema adds `search_vector` as `@db.Unsupported("tsvector")` — Prisma passes
it through transparently without attempting to type-check the column.

---

## Query Parameter Schema (updated tasks.routes.ts AJV)

```typescript
// Extended querystring schema for GET /api/v1/tasks:
querystring: {
  type: 'object',
  properties: {
    // Existing (UNIT-04):
    sortBy: { type: 'string', enum: ['dueDate', 'priority', 'createdAt', 'title'] },
    sortOrder: { type: 'string', enum: ['asc', 'desc'] },
    // New (UNIT-06):
    search: { type: 'string', maxLength: 500 },
    status: { type: 'string', enum: ['active', 'completed', 'all'] },
    priority: {
      oneOf: [
        { type: 'string', enum: ['Low', 'Medium', 'High'] },
        { type: 'array', items: { type: 'string', enum: ['Low', 'Medium', 'High'] } },
      ],
    },
    categoryIds: {
      oneOf: [
        { type: 'string' },
        { type: 'array', items: { type: 'string' } },
      ],
    },
    dueDateFrom: { type: 'string' },
    dueDateTo: { type: 'string' },
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 25 },
  },
}
```

---

## API Endpoint Changes

| Before (UNIT-04) | After (UNIT-06) |
|---|---|
| `GET /api/v1/tasks?sortBy=dueDate&sortOrder=asc` | + `search`, `status`, `priority[]`, `categoryIds[]`, `dueDateFrom`, `dueDateTo`, `page`, `pageSize` |
| Returns all tasks, no pagination | Returns paginated subset with accurate `total` and `totalPages` |

Response shape is **unchanged** — still `PaginatedTasksDTO` with `{ items, total, page, pageSize, totalPages }`.

---

## Key Design Decisions

| Decision | Choice | Impact |
|---|---|---|
| Search (Q1:B) | PostgreSQL FTS with `plainto_tsquery` + STORED generated column | Requires schema migration; GIN index; `$queryRaw` for FTS queries |
| Max pageSize (Q2:B) | 50 | AJV `maximum: 50` on pageSize; 400 if exceeded |
| Date range (Q3:B) | Inclusive-from, exclusive-to | `due_date >= from AND due_date < to` |
| Status enum (Q4:B) | `active` / `completed` / `all` (distinct) | AJV `enum: ['active','completed','all']`; `all` maps to no predicate |
