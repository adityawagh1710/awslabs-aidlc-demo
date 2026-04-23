# NFR Design Patterns — UNIT-06: Backend Search, Filter & Pagination

All patterns from UNIT-01 through UNIT-04 inherited. This document adds UNIT-06-specific patterns.

---

## Pattern 29 — Full-Text Search via Prisma `$queryRaw` Tagged Template

**Applies to**: `TaskRepository.findAll()` when `filters.search` is non-empty

Prisma cannot express the PostgreSQL `@@` FTS operator in its query builder. When a search
term is present, the repository falls back to a `$queryRaw` tagged template. The tagged
template syntax (`Prisma.sql`) automatically parameterizes all interpolated values — no
raw string concatenation, no SQL injection risk.

```typescript
import { Prisma } from '@prisma/client'

// FTS path — only when filters.search is truthy
const tsQuery = filters.search.trim()

const rawTasks = await prisma.$queryRaw<RawTaskRow[]>(Prisma.sql`
  SELECT t.*, json_agg(
    json_build_object('id', c.id, 'name', c.name, 'createdAt', c."createdAt", 'updatedAt', c."updatedAt")
  ) FILTER (WHERE c.id IS NOT NULL) AS categories
  FROM "Task" t
  LEFT JOIN "TaskCategory" tc ON tc."taskId" = t.id
  LEFT JOIN "Category" c ON c.id = tc."categoryId"
  WHERE t."userId" = ${userId}
    AND t.search_vector @@ plainto_tsquery('english', ${tsQuery})
    ${buildStatusSql(filters.status)}
    ${buildPrioritySql(filters.priority)}
    ${buildCategoryIdsSql(filters.categoryIds)}
    ${buildDateFromSql(filters.dueDateFrom)}
    ${buildDateToSql(filters.dueDateTo)}
  GROUP BY t.id
  ORDER BY ${buildOrderBySql(sort)}
  LIMIT ${pagination.pageSize} OFFSET ${(pagination.page - 1) * pagination.pageSize}
`)
```

Each `build*Sql` helper returns a `Prisma.Sql` fragment (via `Prisma.sql` or `Prisma.empty`)
so all predicates remain parameterized — no raw string building.

---

## Pattern 30 — Parallel Count + Data Query

**Applies to**: `TaskRepository.findAll()` (both FTS and filter-only paths)

Running `COUNT(*)` and the paginated `SELECT` sequentially doubles latency. Both queries
share the same WHERE predicates and can run in parallel.

```typescript
const [data, total] = await Promise.all([
  executeDataQuery(userId, filters, pagination, sort),   // SELECT ... LIMIT ... OFFSET
  executeCountQuery(userId, filters),                    // SELECT COUNT(*)
])
return { tasks: mapRawRows(data), total }
```

For non-FTS path, both use Prisma `findMany` and `count` respectively.
For FTS path, both use `$queryRaw` — count query is a separate simpler `$queryRaw<[{count: bigint}]>`.

Note: `COUNT(*)` returns `bigint` in PostgreSQL raw queries — must cast: `Number(row.count)`.

---

## Pattern 31 — Filter Predicate Builder (non-FTS path)

**Applies to**: `TaskRepository.findAll()` when `filters.search` is absent

For filter-only queries (no FTS), Prisma's `findMany` with a programmatic `where` object
is used to retain full type safety. The predicate is built conditionally:

```typescript
function buildPrismaWhere(userId: string, filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { userId }

  if (filters.status === 'active') where.status = 'ACTIVE'
  else if (filters.status === 'completed') where.status = 'COMPLETED'

  if (filters.priority?.length) where.priority = { in: filters.priority.map(p => p.toUpperCase() as Priority) }

  if (filters.categoryIds?.length) {
    where.categories = { some: { categoryId: { in: filters.categoryIds } } }
  }

  if (filters.dueDateFrom) where.dueDate = { ...where.dueDate as object, gte: filters.dueDateFrom }
  if (filters.dueDateTo) where.dueDate = { ...where.dueDate as object, lt: filters.dueDateTo }

  return where
}
```

---

## Pattern 32 — Empty Search Normalisation

**Applies to**: `TaskService.listTasks()` and `TaskController.listTasks()`

US-14 states "searching with an empty string returns all tasks". To enforce this consistently,
the service layer trims and normalizes the search value before passing to the repository:

```typescript
function normalizeSearch(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

// In TaskService.listTasks:
const normalizedSearch = normalizeSearch(input.filters.search)
const filters = { ...input.filters, search: normalizedSearch }
```

An empty or whitespace-only search becomes `undefined`, which skips the FTS predicate
entirely — identical to omitting the `search` param.

---

## Pattern 33 — Date Range Exclusive-To Boundary

**Applies to**: `TaskController.listTasks()` query param parsing

The `dueDateTo` param represents an exclusive upper bound (Q3:B). To make the intent
explicit and prevent off-by-one errors, the controller parses the ISO date string into
a UTC Date object representing midnight of that day:

```typescript
function parseIsoDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

// dueDateTo=2026-05-31 → new Date('2026-05-31T00:00:00.000Z')
// WHERE due_date < '2026-05-31T00:00:00Z'
// → tasks due 2026-05-30 or earlier are included
// → tasks due 2026-05-31 are excluded
```

The same `parseIsoDate` is used for `dueDateFrom` (used as `>=` — so tasks due on that
exact date ARE included).
