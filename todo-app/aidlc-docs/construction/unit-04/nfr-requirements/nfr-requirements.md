# NFR Requirements — UNIT-04: Backend Task CRUD & Categories

## Performance

| Requirement | Target | Rationale |
|---|---|---|
| `GET /api/v1/tasks` p95 latency | < 200 ms | Single-user task list (no search/pagination yet); dominated by one DB query |
| `GET /api/v1/tasks/:id` p95 latency | < 100 ms | Primary key lookup + join for categories |
| `POST/PUT /api/v1/tasks` p95 latency | < 300 ms | Includes category ownership validation (one extra query) + `setCategories` transaction |
| `DELETE /api/v1/tasks/:id` p95 latency | < 150 ms | Transaction: delete task_categories + task |
| `GET/POST/PUT/DELETE /api/v1/categories` p95 latency | < 100 ms | Small per-user dataset; simple CRUD |

### DB Indexes Required (UNIT-04)

| Index | Table | Columns | Covers |
|---|---|---|---|
| `tasks_user_sort_idx` | tasks | `(userId, completed, dueDate NULLS LAST)` | Default list sort: `WHERE userId = ? ORDER BY completed ASC, dueDate ASC NULLS LAST` |
| `task_categories_task_idx` | task_categories | `(taskId)` | Task deletion cascade; `setCategories` replacement |
| `task_categories_category_idx` | task_categories | `(categoryId)` | Category deletion cascade (`removeAllForCategory`) |
| categories name uniqueness | categories | `(name, userId)` via citext | Case-insensitive unique — enforced by `@@unique` with citext column type |

---

## Security

All SECURITY-01 through SECURITY-15 rules inherited from UNIT-01/UNIT-02. UNIT-04 additions:

| Rule | Implementation |
|---|---|
| XSS prevention (SECURITY-04 / BR-T-05, BR-C-05) | `he.encode()` applied to `title`, `description`, `category.name` in service layer before persisting |
| IDOR enforcement (SECURITY-08) | Service layer checks `task.userId === request.user.id` and `category.userId === request.user.id` on every read/write; 403 on ownership mismatch |
| Owner set server-side (SECURITY-09) | `userId` sourced from JWT only; never accepted from request body |
| Cross-user category assignment (BR-T-11) | `CategoryValidationService.validateOwnership()` checks all `categoryIds` belong to requesting user before any write; rejects with 400 on any invalid ID |
| Input length enforcement | AJV schema maxLength on all string fields (title 255, description 2000, category name 50) |
| SQL injection prevention | All queries use Prisma parameterized statements; `citext` comparisons use bound parameters — no raw string interpolation |

---

## Reliability

| Requirement | Implementation |
|---|---|
| Task deletion atomicity | Prisma `$transaction`: delete `task_category` records then `task` — no orphaned join records |
| Category deletion atomicity | Prisma `$transaction`: `removeAllForCategory` then `deleteCategory` — tasks unaffected |
| `setCategories` atomicity | Prisma `$transaction`: delete all existing `task_category` for task then insert new set |
| citext extension availability | Server startup validates `citext` is enabled; fails fast if missing (consistent with UNIT-01 hard-fail pattern) |
| Category ownership race condition | Prevented at DB level by `citext @@unique([name, userId])` — concurrent duplicate inserts fail at constraint level |

---

## Maintainability

| Requirement | Implementation |
|---|---|
| Date handling consistency | `date-fns` + `date-fns-tz` used for all date/timezone operations; no ad-hoc `new Date()` arithmetic |
| HTML escaping centralized | `he.encode()` called in a shared `sanitize.ts` helper in `src/utils/`; applied consistently across all text fields |
| Test coverage | Unit tests: TaskService, CategoryService, CategoryValidationService; Integration tests: all 10 endpoints; PBT: 7 invariants from business-rules.md |
| Timezone validation | IANA timezone strings validated with `date-fns-tz` `isValidTimezone()` before use; invalid strings → 400 |

---

## DB Schema Changes Required (New Prisma Migration)

1. `CREATE EXTENSION IF NOT EXISTS citext` — enables citext type in PostgreSQL
2. Alter `categories.name` from `String` to `String @db.Citext`
3. Add `@@unique([name, userId])` on `Category` model (replaces any existing uniqueness check)
4. Add `@@index([userId, completed, dueDate])` on `Task` model
5. Add `@@index([taskId])` and `@@index([categoryId])` on `TaskCategory` model (if not already present from UNIT-01 schema)
