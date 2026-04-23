# Code Summary — UNIT-06: Backend Search, Filter & Pagination

## New Files Created

| File | Purpose |
|---|---|
| `todo-backend/prisma/migrations/20260423000001_add_fts_filter_indexes/migration.sql` | STORED tsvector generated column + GIN index + composite filter index |
| `tests/unit/task.service.filter.test.ts` | normalizeSearch, pagination math, empty-search normalisation |
| `tests/integration/tasks.filter.test.ts` | status filter, pageSize cap, date range cross-validation, auth |
| `tests/property/tasks.filter.property.test.ts` | PBT-FILTER-02 through PBT-FILTER-06 |

## Modified Files

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `searchVector Unsupported("tsvector")?` field to Task model |
| `src/repositories/task.repository.ts` | Added `TaskFilters`, `PaginationInput` interfaces; dual execution path in `findAll()` (Path A: Prisma findMany for filter-only; Path B: `$queryRaw` FTS for search); helper functions for SQL fragments |
| `src/services/task.service.ts` | Added `TaskListInput`, `normalizeSearch` exports; changed `listTasks()` signature to accept `TaskListInput`; real pagination math |
| `src/controllers/tasks.controller.ts` | Parse 8 new query params; `parseIsoDate()` and `toStringArray()` helpers; cross-field date range validation |
| `src/routes/tasks.routes.ts` | Extended AJV querystring schema with search, status, priority, categoryIds, dueDateFrom, dueDateTo, page, pageSize |

## No New npm Dependencies

## Key Architectural Note
`TaskRepository.findAll()` has two execution paths:
- **Path A** (no `search`): Prisma `findMany` + `count` — full TypeScript type safety
- **Path B** (with `search`): `prisma.$queryRaw` with `Prisma.sql` tagged templates — all inputs auto-parameterized, no SQL injection possible

## Stories Implemented
US-14, US-15, US-16, US-06 (pagination + filtering), US-18 (filter/search query params)
