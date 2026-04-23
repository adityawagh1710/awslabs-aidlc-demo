# UNIT-04 Functional Design Plan — Backend: Task CRUD & Categories

**Unit**: UNIT-04: Backend — Task CRUD & Categories  
**Repository**: `todo-backend`  
**Depends on**: UNIT-02 (AuthPlugin, UserRepository, domain errors)

## Stories Covered
- US-05 Create a Task
- US-06 View Task List (basic list + sort; pagination/filter deferred to UNIT-06)
- US-07 View Task Details
- US-08 Edit a Task
- US-09 Delete a Task
- US-10 Toggle Task Completion
- US-11 Overdue Task Indicators (server-side calculation)
- US-12 Manage Categories and Tags
- US-13 Assign and Remove Tags from Tasks
- US-18 Manage Tasks via the REST API (task CRUD AC)

## Execution Checklist
- [x] Step 1: Analyze unit context (done — unit-of-work.md + stories read)
- [x] Step 2: Answer questions below
- [x] Step 3: Generate business-logic-model.md
- [x] Step 4: Generate business-rules.md
- [x] Step 5: Generate domain-entities.md
- [x] Step 6: Present completion message and await approval

---

## Questions for User

Please fill in the `[Answer]:` tag for each question below, then reply "Done".

---

### Q1: Due date "today or future" — timezone basis

US-05 states due dates must be "today or in the future". When comparing the submitted `dueDate` against "today", which reference should the server use?

A) UTC — server always evaluates "today" in UTC regardless of where the user is  
B) User's local timezone — add a timezone field to the request body so the server can compute the user's local "today"  
C) No server-side enforcement — validate only that the date is a valid ISO date string; let the client enforce the "future" rule  

[Answer]: B

---

### Q2: `isOverdue` field in API responses

US-11 says overdue calculation is "based on the server's date at request time". Where should this computation live?

A) Server computes and returns an `isOverdue: boolean` field in every task response DTO — the client never needs to calculate it  
B) Server does NOT include `isOverdue` in the DTO — the client computes it from `dueDate` compared to its local clock  
C) Server includes both `dueDate` and a separate `serverDate` timestamp in the response so the client can compute it with the authoritative date  

[Answer]: A

---

### Q3: Re-completing a task — `completedAt` behaviour

US-10 says "Completion timestamp is recorded when a task is **first** marked complete." If a user: marks complete → reopens → marks complete again — what should happen to `completedAt`?

A) Preserve the original `completedAt` from the first completion — reopening and re-completing does not change it  
B) Update `completedAt` to the current timestamp each time the task transitions from incomplete → complete  
C) Clear `completedAt` on reopen, set it fresh on re-completion  

[Answer]: A

---

### Q4: Category name uniqueness — case sensitivity

US-12 rejects duplicate category names per user. Should the uniqueness check be case-insensitive?

A) Case-insensitive — "Work", "work", and "WORK" are all considered duplicates of each other  
B) Case-sensitive — "Work" and "work" are distinct category names  

[Answer]: A

---

### Q5: Tasks without a due date — sort position in default list order

US-06 default sort is "incomplete tasks first, then by due date ascending". Where should tasks that have **no due date** appear?

A) At the end — tasks without a due date appear after all tasks that have a due date  
B) At the beginning — tasks without a due date appear before tasks with a due date (undated first)  
C) Interleaved as if due date is null/infinity (i.e., treated as furthest future, so last in ascending sort)  

[Answer]: A

---

### Q6: Cross-user category assignment — partial vs full rejection

US-13 says assigning a category not belonging to the user returns 403. If a `POST /api/v1/tasks` or `PUT /api/v1/tasks/:id` body includes a mix of valid (owned) and invalid (not owned, or non-existent) `categoryIds`:

A) Reject the entire request with 403 — the whole operation fails if any category ID is invalid or unowned  
B) Silently drop the invalid/unowned category IDs and proceed with only the valid ones  
C) Return 400 with a field-level validation error listing each invalid category ID  

[Answer]: C

---

### Q7: Maximum categories per task

Should there be a hard upper limit on how many categories can be assigned to a single task?

A) No limit — a task can have any number of categories  
B) Limit to 10 categories per task  
C) Limit to 20 categories per task  

[Answer]: B

---

### Q8: Task `completedAt` — toggling via dedicated endpoint vs full update

The service signature includes `toggleCompletion(taskId, userId)`. Should toggle completion be exposed as:

A) A dedicated `PATCH /api/v1/tasks/:id/toggle` endpoint (clean semantics, idiomatic REST for state transitions)  
B) Handled via the existing `PUT /api/v1/tasks/:id` — the client sets `completed: true/false` in the body  
C) Both — dedicated toggle endpoint AND `PUT` can also update completion status  

[Answer]: C
