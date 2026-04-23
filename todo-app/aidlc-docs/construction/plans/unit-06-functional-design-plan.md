# UNIT-06 Functional Design Plan — Backend: Search, Filter & Pagination

**Unit**: UNIT-06: Backend — Search, Filter & Pagination  
**Repository**: `todo-backend`  
**Depends on**: UNIT-04 (TaskRepository, TaskService, existing `findAll` with sort only)

## Stories Covered
- US-14 Search Tasks (title + description, case-insensitive substring)
- US-15 Filter Tasks (status, priority, categories, due date range)
- US-16 Combined Filtering, Search, and Sorting (all active simultaneously, AND logic)
- US-06 View Task List (pagination + combined filter AC)
- US-18 Manage Tasks via REST API (filter/search query param AC)

## Existing Code Context
- `TaskRepository.findAll(userId, sort)` — returns all tasks, no filter/pagination
- `TaskService.listTasks(userId, sort)` — wraps findAll, returns PaginatedTasksDTO (page 1, all items)
- `TaskController.listTasks` — reads `sortBy`, `sortOrder` query params only
- `tasks.routes.ts` — AJV schema only validates sortBy/sortOrder query params

## What UNIT-06 Adds
- Extend `TaskRepository.findAll()` to accept `filters: TaskFilters` and `pagination: PaginationInput`
- Extend `TaskService.listTasks()` to parse and pass filters + pagination
- Extend `TaskController.listTasks()` to read filter/search/pagination query params
- Extend `tasks.routes.ts` AJV schema to validate new query params
- New DB indexes for search/filter performance
- Tests: unit, integration, PBT

## Execution Checklist
- [x] Step 1: Analyze unit context
- [x] Step 2: Answer questions below
- [x] Step 3: Generate business-logic-model.md
- [x] Step 4: Generate business-rules.md
- [x] Step 5: Generate domain-entities.md
- [x] Step 6: Present completion message and await approval

---

## Questions for User

Please fill in the `[Answer]:` tag for each question, then reply "Done".

---

### Q1: Search implementation strategy

US-14 requires case-insensitive substring match on `title` and `description`. Which approach?

A) `ILIKE '%query%'` on both columns — simple, no extra setup, good for MVP with indexes  
B) PostgreSQL full-text search (`tsvector` + `to_tsquery`) — more powerful ranking, requires a generated column or trigger  
C) Both — add `ILIKE` now, leave a note to migrate to FTS later  

[Answer]: B

---

### Q2: Maximum page size

US-06 sets default page size at 25. Should the API enforce a maximum page size cap?

A) Max 100 items per page — prevents very large responses  
B) Max 50 items per page  
C) No cap — client can request any pageSize  

[Answer]: B

---

### Q3: Date range filter boundary semantics

When a client sends `dueDateFrom=2026-05-01&dueDateTo=2026-05-31`, are the boundaries:

A) Inclusive on both ends: `dueDate >= from AND dueDate <= to`  
B) Inclusive from, exclusive to: `dueDate >= from AND dueDate < to`  

[Answer]: B

---

### Q4: Status filter — `all` vs omitted

US-15 shows status filter options: All / Active / Completed. When a client sends `status=all` vs sends no `status` param at all, should these behave identically (return everything)?

A) Yes — `status=all` and no `status` param are equivalent; both return all tasks regardless of status  
B) No — omitting `status` returns all tasks; `status=all` is an explicit selection that must be a valid enum value (`all` | `active` | `completed`)  

[Answer]: B
