# UNIT-06 Code Generation Plan — Backend: Search, Filter & Pagination

**Unit**: UNIT-06: Backend — Search, Filter & Pagination  
**Repository**: `todo-backend`  
**Workspace root**: `/home/adityawagh/awslabs-aidlc-demo`

## Unit Context

**Depends on**: UNIT-04 (existing TaskRepository, TaskService, TaskController, tasks.routes.ts)

**Stories implemented**: US-14, US-15, US-16, US-06 (pagination + filtering), US-18 (filter/search query params)

**All UNIT-06 work is modifications — no new source files.** New files are: migration SQL, test files, docs.

**Files to modify** (existing):
- `prisma/schema.prisma` — add `searchVector Unsupported("tsvector")?` field
- `src/repositories/task.repository.ts` — extend `findAll()` with dual execution path (filter-only vs FTS)
- `src/services/task.service.ts` — change `listTasks` signature to accept `TaskListInput`; add `TaskFilters`, `PaginationInput`, `TaskListInput` types
- `src/controllers/tasks.controller.ts` — parse search/filter/pagination query params; cross-field validate date range
- `src/routes/tasks.routes.ts` — extend AJV querystring schema with 8 new params

**Files to create** (new):
- `prisma/migrations/20260423000001_add_fts_filter_indexes/migration.sql`
- `tests/unit/task.service.filter.test.ts`
- `tests/integration/tasks.filter.test.ts`
- `tests/property/tasks.filter.property.test.ts`
- `aidlc-docs/construction/unit-06/code/summary.md`

---

## Execution Checklist

### Part A: Schema & Migration (Steps 1–2)
- [x] Step 1: Add `searchVector Unsupported("tsvector")?  @map("search_vector")` field to Task model in `prisma/schema.prisma`
- [x] Step 2: Create `prisma/migrations/20260423000001_add_fts_filter_indexes/migration.sql` — STORED generated column, GIN index, composite filter index

### Part B: Repository Extension (Step 3)
- [x] Step 3: Extend `src/repositories/task.repository.ts` — add `TaskFilters`, `PaginationInput` interfaces; refactor `findAll()` with dual path (Path A: Prisma `findMany`+`count` for no-search; Path B: `$queryRaw` FTS + count for search); add `buildPrismaWhere()`, `parseIsoDate()`, `normalizeSearch()` helpers; update `buildOrderBy()` for pagination

### Part C: Service Extension (Step 4)
- [x] Step 4: Extend `src/services/task.service.ts` — add `TaskListInput` type; change `listTasks()` to `listTasks(userId, input: TaskListInput)` with real pagination math; normalise search before passing to repo

### Part D: Controller & Routes Extension (Steps 5–6)
- [x] Step 5: Extend `src/controllers/tasks.controller.ts` — `listTasks()` parses all new query params (`search`, `status`, `priority`, `categoryIds`, `dueDateFrom`, `dueDateTo`, `page`, `pageSize`); cross-field validates `dueDateFrom < dueDateTo`; builds `TaskListInput` object
- [x] Step 6: Extend `src/routes/tasks.routes.ts` — add 8 new querystring properties to AJV schema (`search`, `status`, `priority`, `categoryIds`, `dueDateFrom`, `dueDateTo`, `page`, `pageSize`)

### Part E: Tests (Steps 7–9)
- [x] Step 7: Create `tests/unit/task.service.filter.test.ts` — unit tests for empty-search normalisation, date cross-field validation, status mapping, pagination math
- [x] Step 8: Create `tests/integration/tasks.filter.test.ts` — integration tests for search, status filter, priority filter, date range, pagination, combined filters
- [x] Step 9: Create `tests/property/tasks.filter.property.test.ts` — PBT for PBT-FILTER-01 through PBT-FILTER-06

### Part F: Documentation (Step 10)
- [x] Step 10: Create `aidlc-docs/construction/unit-06/code/summary.md`

---

## Story Traceability

| Story | Implemented By Steps |
|---|---|
| US-14 Search Tasks | Steps 3, 4, 5, 6 |
| US-15 Filter Tasks | Steps 3, 4, 5, 6 |
| US-16 Combined Filter+Search+Sort | Steps 3, 4, 5, 6 |
| US-06 Pagination | Steps 3, 4, 5, 6 |
| US-18 REST API filter params | Steps 5, 6 |

**Total steps: 10 across 6 parts**
