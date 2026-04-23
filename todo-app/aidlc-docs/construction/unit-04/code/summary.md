# Code Summary — UNIT-04: Backend Task CRUD & Categories

## New Files Created

| File | Purpose |
|---|---|
| `todo-backend/src/utils/sanitize.ts` | `he.encode()` wrappers for XSS prevention |
| `todo-backend/src/utils/date.ts` | Timezone validation, due date check, isOverdue computation |
| `todo-backend/src/services/category-validation.service.ts` | Batch category ownership validation |
| `todo-backend/prisma/migrations/20260422000000_init/migration.sql` | Initial schema migration |
| `todo-backend/prisma/migrations/20260423000000_add_citext_task_indexes/migration.sql` | citext extension + composite sort index |
| `todo-backend/tests/unit/task.service.test.ts` | TaskService unit tests |
| `todo-backend/tests/unit/category.service.test.ts` | CategoryService unit tests |
| `todo-backend/tests/integration/tasks.test.ts` | Task endpoint integration tests |
| `todo-backend/tests/integration/categories.test.ts` | Category endpoint integration tests |
| `todo-backend/tests/property/tasks.property.test.ts` | PBT invariant tests |

## Modified Files

| File | Change |
|---|---|
| `todo-backend/src/repositories/task.repository.ts` | Implemented (was stub) — findAll with sort/NULLS LAST, findById with categories, CRUD |
| `todo-backend/src/repositories/category.repository.ts` | Implemented (was stub) — citext-aware findByNameAndUser, full CRUD |
| `todo-backend/src/repositories/task-category.repository.ts` | Implemented (was stub) — atomic setCategories, cascade helpers |
| `todo-backend/src/services/task.service.ts` | Implemented (was stub) — 6 methods + toTaskDTO mapper |
| `todo-backend/src/services/category.service.ts` | Implemented (was stub) — 4 methods with conflict detection |
| `todo-backend/src/controllers/tasks.controller.ts` | Implemented (was stub) — 6 controller methods |
| `todo-backend/src/controllers/categories.controller.ts` | Implemented (was stub) — 4 controller methods |
| `todo-backend/src/routes/tasks.routes.ts` | Implemented (was stub) — 6 routes with AJV schemas |
| `todo-backend/src/routes/categories.routes.ts` | Implemented (was stub) — 4 routes with AJV schemas |
| `todo-backend/src/domain/errors.ts` | Extended ValidationError.fields to `Record<string, string \| string[]>` |
| `todo-backend/prisma/schema.prisma` | Added `@db.Citext` to Category.name, added composite sort index |

## New npm Dependencies

| Package | Purpose |
|---|---|
| `date-fns` + `date-fns-tz` | Timezone-aware date validation and isOverdue computation |
| `he` + `@types/he` | HTML entity encoding for XSS prevention |

## API Endpoints Added

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | /api/v1/tasks | ✓ | 200 |
| POST | /api/v1/tasks | ✓ | 201 |
| GET | /api/v1/tasks/:id | ✓ | 200 / 404 / 403 |
| PUT | /api/v1/tasks/:id | ✓ | 200 / 404 / 403 |
| DELETE | /api/v1/tasks/:id | ✓ | 204 / 404 / 403 |
| PATCH | /api/v1/tasks/:id/toggle | ✓ | 200 / 404 / 403 |
| GET | /api/v1/categories | ✓ | 200 |
| POST | /api/v1/categories | ✓ | 201 / 409 |
| PUT | /api/v1/categories/:id | ✓ | 200 / 404 / 403 / 409 |
| DELETE | /api/v1/categories/:id | ✓ | 204 / 404 / 403 |

## Stories Implemented
US-05, US-06 (basic list+sort), US-07, US-08, US-09, US-10, US-11, US-12, US-13, US-18 (task CRUD AC)
