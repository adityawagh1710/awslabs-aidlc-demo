# Tech Stack Decisions — UNIT-06: Backend Search, Filter & Pagination

## Inherited from UNIT-01 + UNIT-02 + UNIT-04 (unchanged)
Node 22 LTS, TypeScript 5.7, PostgreSQL 17, Redis 7, Fastify 5, Prisma 6, ioredis 5,
bcryptjs 2, Vitest 2, fast-check 3, ESLint 9, Prettier 3, GitHub Actions,
AJV (Fastify), zod (env), date-fns, date-fns-tz, he.

---

## UNIT-06 Additions

| Decision | Choice | Rationale |
|---|---|---|
| **Search implementation** | PostgreSQL FTS — `tsvector` STORED generated column + `plainto_tsquery` (Q1:B) | Better than ILIKE for stemming and relevance; STORED column means index is updated automatically on write; `plainto_tsquery` requires no special query syntax from clients |
| **$queryRaw usage** | Prisma tagged template `$queryRaw<T>` — NEVER `$queryRawUnsafe` | Tagged template auto-parameterizes all interpolated values; eliminates SQL injection risk for FTS queries |
| **FTS language** | `'english'` hardcoded in both column definition and query | Single-language MVP; no user locale needed; English stemming handles common variations |
| **Filter query strategy** | Prisma `findMany` for filter-only queries; `$queryRaw` only when `search` is present | Maximizes type safety; `$queryRaw` used only for the FTS `@@` operator which Prisma cannot express natively |
| **Count query** | `prisma.task.count({ where: ... })` run in parallel with `findMany` | `Promise.all([count, data])` halves round-trips; Prisma count uses same index as data query |

---

## New Prisma Migration

Migration name: `add_fts_filter_indexes`

```sql
-- STORED generated column for full-text search
ALTER TABLE "Task"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  ) STORED;

-- GIN index on the generated column
CREATE INDEX "tasks_search_vector_gin_idx" ON "Task" USING GIN ("search_vector");

-- Composite filter index
CREATE INDEX "Task_userId_priority_status_idx" ON "Task" ("userId", priority, status);
```

Prisma schema addition:
```prisma
model Task {
  // ... existing fields ...
  searchVector  Unsupported("tsvector")?  @map("search_vector")
}
```

---

## No New npm Dependencies
UNIT-06 adds no new runtime or dev packages.
