# Tech Stack Decisions — UNIT-04: Backend Task CRUD & Categories

## Inherited from UNIT-01 + UNIT-02 (unchanged)
Node 22 LTS, TypeScript 5.7, PostgreSQL 17, Redis 7, Fastify 5, Prisma 6, ioredis 5,
bcryptjs 2 (rounds 12), Vitest 2, fast-check 3, ESLint 9, Prettier 3, GitHub Actions,
AJV (Fastify), zod (env), @fastify/helmet, @fastify/cors, @fastify/rate-limit, @fastify/jwt,
pino structured logging.

---

## UNIT-04 Additions

| Decision | Choice | Rationale |
|---|---|---|
| **Date/timezone library** | `date-fns` + `date-fns-tz` | Tree-shakeable; `date-fns` for UTC operations (startOfDay, isBefore); `date-fns-tz` for user-timezone validation (toZonedTime, startOfDay in IANA tz); ~15 KB combined. Chosen over Luxon (Q1:A). |
| **HTML escaping** | `he` 1.x | Encodes `< > & " '` as HTML entities; minimal footprint (~10 KB); no tag-stripping needed for a JSON API. Applied via `sanitize.ts` helper in `src/utils/`. Chosen over `sanitize-html` (Q2:A). |
| **Case-insensitive category uniqueness** | PostgreSQL `citext` extension | `categories.name` column typed `@db.Citext`; `@@unique([name, userId])` in Prisma schema then enforces uniqueness case-insensitively at the DB level. Cleanest option — no application-level LOWER() needed; no race condition. Chosen over raw SQL expression index or app-level only (Q3:C). |

---

## New DB Migration Required

Migration name: `add_citext_task_indexes`

```sql
-- 1. Enable citext extension
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Alter categories.name to citext (Prisma generates the column type change)
-- 3. Add task list sort index
CREATE INDEX tasks_user_sort_idx ON tasks (user_id, completed, due_date NULLS LAST);
-- 4. task_category join table indexes (if not already present)
CREATE INDEX IF NOT EXISTS task_categories_task_idx ON task_categories (task_id);
CREATE INDEX IF NOT EXISTS task_categories_category_idx ON task_categories (category_id);
```

Prisma schema changes (`schema.prisma`):
```prisma
model Category {
  name   String @db.Citext          // changed from String
  // ...
  @@unique([name, userId])          // case-insensitive unique via citext
}

model Task {
  // ...
  @@index([userId, completed, dueDate])
}
```

---

## New npm Dependencies

| Package | Version | Purpose |
|---|---|---|
| `date-fns` | ^3.x | Date arithmetic (startOfDay, isBefore, etc.) |
| `date-fns-tz` | ^3.x | Timezone-aware date operations (toZonedTime, startOfDay in IANA tz, isValidTimezone) |
| `he` | ^1.x | HTML entity encoding for XSS prevention |

---

## New Environment Variables

None required for UNIT-04. All new functionality uses existing config (DB URL, JWT, etc.).
