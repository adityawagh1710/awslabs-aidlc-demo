# Business Logic Model — UNIT-06: Backend Search, Filter & Pagination

## Overview

UNIT-06 extends `GET /api/v1/tasks` to accept search, filter, and pagination query parameters.
All new parameters are additive — existing clients with no new params get identical behaviour.
All logic operates exclusively on the requesting user's tasks (userId scoping unchanged).

---

## Flow 1: List Tasks with Filters, Search & Pagination

```
GET /api/v1/tasks?search=buy&status=active&priority=High,Medium
               &categoryIds=cat1,cat2&dueDateFrom=2026-05-01&dueDateTo=2026-05-31
               &page=2&pageSize=25&sortBy=dueDate&sortOrder=asc
    │
    ▼
AuthPlugin → extract userId
    │
    ▼
AJV schema validation (extended):
    - search: string, optional, max 500 chars
    - status: enum('active','completed','all'), optional
    - priority: comma-separated enum values or array
    - categoryIds: array of strings, optional
    - dueDateFrom: ISO date string (YYYY-MM-DD), optional
    - dueDateTo: ISO date string (YYYY-MM-DD), optional
    - page: integer ≥ 1, default 1
    - pageSize: integer 1–50, default 25
    - sortBy: enum('dueDate','priority','createdAt','title'), optional
    - sortOrder: enum('asc','desc'), default 'asc'
    │
    ├── validation failure → 400 with field-level errors
    ▼
TaskController.listTasks parses params into TaskListInput
    │
    ▼
TaskService.listTasks(userId, filters, pagination, sort)
    │
    ▼
TaskRepository.findAll(userId, filters, pagination, sort)
    │
    ├── Build WHERE predicates:
    │     - userId = ?                           [always]
    │     - FTS: search_vector @@ plainto_tsquery('english', ?)  [if search]
    │     - status = 'ACTIVE'/'COMPLETED'        [if status=active/completed]
    │     - priority IN (?)                      [if priority[]  present]
    │     - EXISTS (task_category JOIN)          [if categoryIds[] present]
    │     - due_date >= dueDateFrom              [if dueDateFrom] — inclusive
    │     - due_date < dueDateTo                 [if dueDateTo]  — exclusive (Q3:B)
    │
    ├── Execute in parallel:
    │     COUNT(*) with same WHERE (for total)
    │     SELECT ... WHERE ... ORDER BY ... LIMIT pageSize OFFSET (page-1)*pageSize
    │
    ▼
Returns { tasks: Task[], total: number }
    │
    ▼
TaskService maps to DTOs (isOverdue computed per task)
    │
    ▼
Returns PaginatedTasksDTO:
    {
      items: TaskDTO[],
      total: <total matching count>,
      page: <requested page>,
      pageSize: <requested pageSize>,
      totalPages: Math.ceil(total / pageSize)
    }
```

---

## Flow 2: Search with Empty String

```
GET /api/v1/tasks?search=
    │
    ├── search param present but empty string
    ▼
TaskService treats empty search as no search filter (equivalent to omitting search)
    │  (per US-14: "empty string returns all tasks")
    ▼
FTS predicate is NOT added to WHERE clause
    │
    ▼
Returns all user tasks (subject to other active filters)
```

---

## Flow 3: Date Range Boundary Semantics (Q3:B — Inclusive-from, Exclusive-to)

```
dueDateFrom=2026-05-01 → WHERE due_date >= '2026-05-01T00:00:00Z'
dueDateTo=2026-05-31   → WHERE due_date < '2026-05-31T00:00:00Z'

Result: tasks due on 2026-05-01 through 2026-05-30 (inclusive)
        tasks due ON 2026-05-31 are NOT included

Validation: if dueDateFrom AND dueDateTo both provided:
    dueDateFrom >= dueDateTo → 400: "dueDateFrom must be before dueDateTo"
```

---

## Flow 4: Status Filter Semantics (Q4:B — status=all is explicit enum)

```
No status param  → no status filter (returns active + completed)
status=all       → explicit: no status filter (same effect, different semantics)
status=active    → WHERE status = 'ACTIVE'
status=completed → WHERE status = 'COMPLETED'
```

---

## Flow 5: Category Filter (EXISTS subquery)

```
categoryIds=cat1,cat2
    │
    ▼
WHERE EXISTS (
  SELECT 1 FROM task_categories tc
  WHERE tc.task_id = tasks.id
  AND tc.category_id IN ('cat1', 'cat2')
)

Semantics: returns tasks that have AT LEAST ONE of the supplied categories
           (OR logic within the category filter — consistent with US-15 multi-select)
```

---

## Full-Text Search Implementation (Q1:B — PostgreSQL FTS)

```
Prerequisites (added by UNIT-06 migration):
- tasks.search_vector: tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  ) STORED
- GIN index on tasks.search_vector

Query-time FTS predicate:
    WHERE search_vector @@ plainto_tsquery('english', ?)

plainto_tsquery: converts plain text to tsquery automatically
  - "buy groceries" → 'buy' & 'groceries'
  - handles stemming (buy/buying/bought all match)
  - language: 'english' (stemming dictionary)

Note: search_vector is regenerated automatically on INSERT/UPDATE via STORED generated column
```
