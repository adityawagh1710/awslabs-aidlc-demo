# UNIT-04 NFR Requirements Plan — Backend: Task CRUD & Categories

**Unit**: UNIT-04: Backend — Task CRUD & Categories  
**Repository**: `todo-backend`

## Inherited Tech Stack (no re-decision needed)
All UNIT-01 and UNIT-02 decisions carry forward unchanged:
Node 22 LTS, TypeScript 5.7, PostgreSQL 17, Redis 7, Fastify 5, Prisma 6, ioredis 5,
bcryptjs 2, Vitest 2, fast-check 3, ESLint 9, Prettier 3, GitHub Actions, AJV validation.

## Execution Checklist
- [x] Step 1: Analyze functional design artifacts
- [x] Step 2: Answer questions below
- [x] Step 3: Generate nfr-requirements.md
- [x] Step 4: Generate tech-stack-decisions.md
- [x] Step 5: Present completion message and await approval

---

## Questions for User

UNIT-04 introduces three new technical concerns not previously decided. Please fill in the
`[Answer]:` tag for each question, then reply "Done".

---

### Q1: Date / timezone library

UNIT-04 needs timezone-aware date handling for two reasons:
1. Validating `dueDate` against start-of-today in the **user's supplied IANA timezone** (Q1:B from Functional Design)
2. Computing `isOverdue` using server UTC midnight

Which library should handle this?

A) `date-fns` + `date-fns-tz` — tree-shakeable, widely used, two separate packages (~15 KB combined)  
B) `Luxon` — immutable DateTime objects with first-class timezone support, single package (~70 KB)  
C) Node 22 native `Temporal` API (no extra dependency) — available behind `--experimental-temporal` flag in Node 22; API is stable-ish but still experimental in Node 22  

[Answer]: A

---

### Q2: HTML escaping / XSS prevention approach

`title`, `description`, and `category.name` must be HTML-escaped before persisting (BR-T-05, BR-C-05). The AJV schema validation already rejects malformed JSON, but does not escape HTML entities.

A) `he` library — minimal (~10 KB), encodes HTML entities (`<>&"'`), well-tested, no stripping  
B) `sanitize-html` — strips or allows-lists tags; heavier (~200 KB) but more configurable  
C) Custom inline escaping — a 5-line helper replacing `< > & " '` with entities; zero extra dep  

[Answer]: A

---

### Q3: Case-insensitive category name uniqueness — DB enforcement strategy

The business rule (BR-C-02) requires uniqueness of `(LOWER(name), userId)` per user. Prisma's `@@unique` does not support expression indexes natively.

A) Raw SQL migration — add `CREATE UNIQUE INDEX categories_name_user_unique ON categories (lower(name), user_id)` in a Prisma custom migration; application still uses LOWER() in queries  
B) Application-level only — no DB unique constraint; rely on `findByNameAndUser(LOWER(name))` check in `CategoryService`; risk: race condition under concurrent requests (acceptable for MVP)  
C) PostgreSQL `citext` extension — change the `name` column type to `citext`; Prisma supports `@db.Citext`; unique constraint on `(name, userId)` then automatically case-insensitive  

[Answer]: C 
