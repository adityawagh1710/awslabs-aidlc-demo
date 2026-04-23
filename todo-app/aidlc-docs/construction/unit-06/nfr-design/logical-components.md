# Logical Components — UNIT-06: Backend Search, Filter & Pagination

## Files Modified (no new files — all modifications to existing UNIT-04 code)

```
todo-backend/
├── prisma/
│   ├── schema.prisma                          ← MODIFIED: add searchVector field
│   └── migrations/
│       └── 20260423000001_add_fts_filter_indexes/
│           └── migration.sql                  ← NEW: STORED generated column + indexes
├── src/
│   ├── repositories/
│   │   └── task.repository.ts                 ← MODIFIED: extend findAll with filters+pagination+FTS
│   ├── services/
│   │   └── task.service.ts                    ← MODIFIED: extend listTasks signature
│   ├── controllers/
│   │   └── tasks.controller.ts                ← MODIFIED: parse filter/pagination query params
│   └── routes/
│       └── tasks.routes.ts                    ← MODIFIED: extend AJV querystring schema
└── tests/
    ├── unit/
    │   └── task.service.filter.test.ts        ← NEW: unit tests for filter logic
    ├── integration/
    │   └── tasks.filter.test.ts               ← NEW: integration tests for filter endpoints
    └── property/
        └── tasks.filter.property.test.ts      ← NEW: PBT for filter invariants
```

---

## Component Responsibilities (updated)

### `TaskRepository.findAll()` (major extension)

Two execution paths based on whether `filters.search` is present:

**Path A — No search (filter-only)**:
```
buildPrismaWhere(userId, filters)           → Prisma.TaskWhereInput
Promise.all([
  prisma.task.findMany({ where, orderBy, skip, take, include: { categories } }),
  prisma.task.count({ where }),
])
→ { tasks, total }
```

**Path B — With search (FTS)**:
```
normalizeSearch(filters.search) → trimmed string
buildFtsWhereFragments(filters) → Prisma.Sql predicates
Promise.all([
  prisma.$queryRaw<RawTaskRow[]>(Prisma.sql`SELECT ... WHERE ... @@ plainto_tsquery(...)`)
  prisma.$queryRaw<[{count: bigint}]>(Prisma.sql`SELECT COUNT(*) WHERE ... @@ plainto_tsquery(...)`)
])
→ mapRawRows(rawTasks), Number(countRow.count)
→ { tasks, total }
```

### `TaskService.listTasks()` (signature change)

```typescript
// Before: listTasks(userId, sort)
// After:  listTasks(userId, input: TaskListInput)

async listTasks(userId: string, input: TaskListInput): Promise<PaginatedTasksDTO> {
  const normalizedFilters = { ...input.filters, search: normalizeSearch(input.filters.search) }
  const { tasks, total } = await this.taskRepo.findAll(userId, normalizedFilters, input.pagination, input.sort)
  const now = new Date()
  const items = tasks.map(t => toTaskDTO(t, now))
  const { page, pageSize } = input.pagination
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 }
}
```

### `TaskController.listTasks()` (new query param parsing)

```typescript
async listTasks(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = request.user.sub
  const q = request.query as TaskListQuery

  const filters: TaskFilters = {
    search: q.search,
    status: q.status as TaskFilters['status'],
    priority: normalizePriorityParam(q.priority),    // string|string[] → string[]
    categoryIds: normalizeCategoryIdsParam(q.categoryIds),
    dueDateFrom: q.dueDateFrom ? parseIsoDate(q.dueDateFrom) : undefined,
    dueDateTo: q.dueDateTo ? parseIsoDate(q.dueDateTo) : undefined,
  }

  // Cross-field validation: dueDateFrom must be before dueDateTo
  if (filters.dueDateFrom && filters.dueDateTo && filters.dueDateFrom >= filters.dueDateTo) {
    throw new ValidationError('Validation failed', {
      dueDateFrom: 'dueDateFrom must be before dueDateTo',
    })
  }

  const pagination: PaginationInput = {
    page: q.page ?? 1,
    pageSize: q.pageSize ?? 25,
  }

  const sort: TaskSortInput = { sortBy: q.sortBy, sortOrder: q.sortOrder }

  const result = await this.taskService.listTasks(userId, { filters, pagination, sort })
  reply.send(result)
}
```

### `tasks.routes.ts` AJV schema (extended querystring)

New query params added alongside existing `sortBy`/`sortOrder`:
- `search`: string, maxLength 500
- `status`: enum `['active','completed','all']`
- `priority`: string or array (AJV `oneOf`)
- `categoryIds`: string or array
- `dueDateFrom`, `dueDateTo`: string (ISO date, further validated in controller)
- `page`: integer, minimum 1, default 1
- `pageSize`: integer, minimum 1, maximum 50, default 25

---

## Data Flow — Filtered Task List

```
GET /api/v1/tasks?search=urgent&status=active&priority=High&page=1&pageSize=25
    │
    ▼
AJV validates all query params → 400 on type/enum violations
    │
    ▼
TaskController
    ├── parse + normalise query params into TaskListInput
    ├── cross-field validate (dueDateFrom < dueDateTo)
    └── throws ValidationError → 400 if invalid
    │
    ▼
TaskService.listTasks(userId, { filters, pagination, sort })
    ├── normalizeSearch: 'urgent' → 'urgent' (non-empty, kept)
    └── calls TaskRepository.findAll(...)
    │
    ▼
TaskRepository.findAll — Path B (search present)
    ├── FTS data query ($queryRaw, Pattern 29)   ─┐ parallel
    └── FTS count query ($queryRaw, Pattern 30)   ─┘
    │
    ▼
{ tasks: TaskWithCategories[], total: 3 }
    │
    ▼
TaskService maps to DTOs (isOverdue computed per task)
    │
    ▼
{
  items: [TaskDTO, TaskDTO, TaskDTO],
  total: 3,
  page: 1,
  pageSize: 25,
  totalPages: 1
}
```

---

## RawTaskRow Type (for $queryRaw FTS queries)

```typescript
interface RawTaskRow {
  id: string
  userId: string
  title: string
  description: string | null
  status: 'ACTIVE' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  categories: Array<{ id: string; name: string; createdAt: Date; updatedAt: Date }> | null
}
```

The `categories` JSON aggregation from the raw query is parsed and mapped to match
`TaskWithCategories` shape before returning from the repository.
