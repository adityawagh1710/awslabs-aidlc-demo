# UNIT-05 Functional Design Plan — Frontend: Task CRUD & Categories UI

**Unit**: UNIT-05: Frontend — Task CRUD & Categories UI  
**Repository**: `todo-frontend`  
**Depends on**: UNIT-03 (auth, store, routing, AppShell) + UNIT-04 (task/category API)

## Stories Covered
- US-05 Create a Task (frontend)
- US-06 View Task List (basic list + sort UI)
- US-07 View Task Details (frontend)
- US-08 Edit a Task (frontend)
- US-09 Delete a Task (frontend, with confirmation)
- US-10 Toggle Task Completion (frontend)
- US-11 Overdue Task Indicators (OverdueBadge)
- US-12 Manage Categories and Tags (CategoryManagementPage)
- US-13 Assign/Remove Tags from Tasks (CategoryPicker in TaskForm)

## Existing Frontend Context
- React Router, Redux Toolkit, RTK Query, shadcn/ui, react-hook-form + Zod, Tailwind CSS
- Existing routes: `/login`, `/register`, `/` (DashboardPage placeholder)
- Existing store: `authSlice`, `uiSlice` (returnTo + toasts), `authApi`
- DashboardPage is currently a placeholder

## Execution Checklist
- [x] Step 1: Analyze unit context
- [x] Step 2: Answer questions below
- [x] Step 3: Generate business-logic-model.md
- [x] Step 4: Generate business-rules.md
- [x] Step 5: Generate domain-entities.md
- [x] Step 6: Generate frontend-components.md
- [x] Step 7: Present completion message and await approval

---

## Questions for User

Please fill in the `[Answer]:` tag for each question below, then reply "Done".

---

### Q1: Route structure for new pages

UNIT-05 adds task detail, task create/edit, and category management pages. What URL structure should these use?

A) `/tasks/new` (create), `/tasks/:id` (detail), `/tasks/:id/edit` (edit), `/categories` (management)  
B) `/` (dashboard with inline modal for create/edit), `/tasks/:id` (detail page only), `/categories` (management)  
C) `/` (dashboard only — create/edit/detail all as dialogs/modals, no separate routes)  

[Answer]: A 

---

### Q2: Optimistic UI for task toggle and delete

When the user toggles task completion or deletes a task, should the UI update immediately (before the server responds) or wait for server confirmation?

A) Optimistic — UI updates instantly; error toasts + rollback if server fails  
B) Pessimistic — show loading state; update only on successful server response  
C) Optimistic for toggle; pessimistic for delete (delete is destructive)  

[Answer]: A

---

### Q3: OverdueBadge visual treatment

US-11 says overdue tasks should have a visual indicator. What style?

A) Red due date text + small "Overdue" badge chip next to the date  
B) Full `TaskCard` row gets a red left-border accent (no text badge)  
C) Due date turns red — no additional badge or label  

[Answer]: B

---

### Q4: CategoryPicker in TaskForm

When assigning categories to a task in the create/edit form, what interaction pattern?

A) Multi-select dropdown — click to open, checkboxes inside, shows selected as tags below  
B) Tag-style input — existing categories shown as clickable chips; click to toggle  
C) Checkbox list — all user categories listed vertically with checkboxes  

[Answer]: B

---

### Q5: Sort controls UI on DashboardPage

US-06 requires sorting by due date, priority, creation date, title. What UI for sort controls?

A) Single "Sort by" dropdown with combined field + direction options (e.g., "Due Date ↑")  
B) Two separate controls: a "Sort by" dropdown for field, and an "↑/↓" toggle button for direction  
C) Sort icons on column headers (table-style layout)  

[Answer]: B

---

### Q6: DashboardPage layout for task list

How should tasks be displayed on the DashboardPage?

A) Card list — each task is a `TaskCard` component in a vertical list  
B) Table — tasks shown as rows with columns (title, priority, due date, status)  
C) Kanban-style columns by status (Active / Completed) — two columns side by side  

[Answer]: B
