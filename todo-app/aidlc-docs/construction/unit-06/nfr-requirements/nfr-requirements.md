# NFR Requirements — UNIT-06: Backend Search, Filter & Pagination

## Performance

All UNIT-01/UNIT-04 performance targets inherited. UNIT-06 additions:

| Requirement | Target | Enforcement |
|---|---|---|
| `GET /api/v1/tasks` with search query (FTS) | p95 < 300 ms | GIN index on `search_vector`; query uses index scan not sequential |
| `GET /api/v1/tasks` with filters only (no FTS) | p95 < 200 ms | Existing composite indexes + new `(userId, priority, status)` index |
| Pagination count query | < 50 ms additional overhead | `COUNT(*)` runs with same indexed WHERE; parallel with data query |
| Max response payload | pageSize ≤ 50 enforced | AJV `maximum: 50`; prevents accidental large responses |

### DB Indexes Added by UNIT-06

| Index | Table | Columns/Expression | Purpose |
|---|---|---|---|
| `tasks_search_vector_gin_idx` | Task | `USING GIN (search_vector)` | FTS lookup |
| `Task_userId_priority_status_idx` | Task | `(userId, priority, status)` | Combined priority+status filter |
| `search_vector` generated column | Task | `to_tsvector('english', title \|\| ' ' \|\| COALESCE(description,'')) STORED` | Source for GIN index |

---

## Security

All SECURITY-01 through SECURITY-15 inherited. UNIT-06 additions:

| Requirement | Implementation |
|---|---|
| SQL injection via search param | Prisma `$queryRaw` uses tagged template literals — inputs are always parameterized; never interpolated as raw SQL |
| SQL injection via filter params | All filter values (priority, categoryIds, dates) passed through Prisma parameterized queries or validated enum values |
| IDOR on filtered results | `userId` WHERE predicate always applied first in all query paths; FTS does not bypass user scoping |
| Search result leakage | `plainto_tsquery` operates only on the calling user's task rows (userId scoping at DB level) |

---

## Reliability

| Requirement | Implementation |
|---|---|
| `$queryRaw` type safety | FTS queries use Prisma typed `$queryRaw<RawTaskRow[]>` with explicit result mapping; runtime Zod parse validates shape |
| FTS generated column unavailability | If PostgreSQL version does not support STORED generated columns (requires PG 12+), migration will fail at deploy time — acceptable since we target PG 17 |
| Out-of-range page | Returns empty `items: []` with correct `total` — not a 404 (BR-P-04) |
| Invalid date format in filter | AJV string format validation rejects malformed dates before service layer |

---

## No New npm Dependencies
All UNIT-06 functionality uses existing Prisma, Fastify, and Vitest stack.
No new packages required.
