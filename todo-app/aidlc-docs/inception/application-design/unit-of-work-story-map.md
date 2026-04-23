# Unit of Work Story Map — TODO List App

All 18 user stories mapped to their implementing unit(s).

---

## Story → Unit Mapping

| Story ID | Title | Primary Unit | Secondary Unit |
|---|---|---|---|
| US-01 | Register a New Account | UNIT-02 (backend) | UNIT-03 (frontend) |
| US-02 | Log In to an Existing Account | UNIT-02 (backend) | UNIT-03 (frontend) |
| US-03 | Log Out | UNIT-02 (backend) | UNIT-03 (frontend) |
| US-04 | Session Expiry Handling | UNIT-02 (backend) | UNIT-03 (frontend) |
| US-05 | Create a Task | UNIT-04 (backend) | UNIT-05 (frontend) |
| US-06 | View Task List | UNIT-04 (basic list) + UNIT-06 (filter/pagination) | UNIT-05 (basic) + UNIT-07 (full) |
| US-07 | View Task Details | UNIT-04 (backend) | UNIT-05 (frontend) |
| US-08 | Edit a Task | UNIT-04 (backend) | UNIT-05 (frontend) |
| US-09 | Delete a Task | UNIT-04 (backend) | UNIT-05 (frontend) |
| US-10 | Toggle Task Completion | UNIT-04 (backend) | UNIT-05 (frontend) |
| US-11 | Overdue Task Indicators | UNIT-04 (backend logic) | UNIT-05 (frontend badge) |
| US-12 | Manage Categories and Tags | UNIT-04 (backend) | UNIT-05 (frontend) |
| US-13 | Assign and Remove Tags from Tasks | UNIT-04 (backend) | UNIT-05 (frontend) |
| US-14 | Search Tasks | UNIT-06 (backend) | UNIT-07 (frontend) |
| US-15 | Filter Tasks | UNIT-06 (backend) | UNIT-07 (frontend) |
| US-16 | Combined Filtering, Search, and Sorting | UNIT-06 (backend) | UNIT-07 (frontend) |
| US-17 | Authenticate via the REST API | UNIT-02 (all AC) | — |
| US-18 | Manage Tasks via the REST API | UNIT-04 (task AC) + UNIT-06 (filter AC) | — |

---

## Unit → Story Mapping

### UNIT-01: DB & Infrastructure Foundation
No user stories directly. Enables all subsequent units.

### UNIT-02: Backend — Auth & User Management
- US-01 — Register a New Account (all backend AC)
- US-02 — Log In to an Existing Account (all backend AC)
- US-03 — Log Out (all backend AC)
- US-04 — Session Expiry Handling (all backend AC)
- US-17 — Authenticate via the REST API (all AC)

### UNIT-03: Frontend — Auth UI
- US-01 — Register a New Account (all frontend AC)
- US-02 — Log In to an Existing Account (all frontend AC)
- US-03 — Log Out (all frontend AC)
- US-04 — Session Expiry Handling (all frontend AC)

### UNIT-04: Backend — Task CRUD & Categories
- US-05 — Create a Task (all backend AC)
- US-06 — View Task List (basic list + sort AC; pagination/filter AC in UNIT-06)
- US-07 — View Task Details (all backend AC)
- US-08 — Edit a Task (all backend AC)
- US-09 — Delete a Task (all backend AC)
- US-10 — Toggle Task Completion (all backend AC)
- US-11 — Overdue Task Indicators (backend calculation AC)
- US-12 — Manage Categories and Tags (all backend AC)
- US-13 — Assign and Remove Tags from Tasks (all backend AC)
- US-18 — Manage Tasks via the REST API (task CRUD AC; filter/search AC in UNIT-06)

### UNIT-05: Frontend — Task CRUD & Categories UI
- US-05 — Create a Task (all frontend AC)
- US-06 — View Task List (basic list + sort AC)
- US-07 — View Task Details (all frontend AC)
- US-08 — Edit a Task (all frontend AC)
- US-09 — Delete a Task (all frontend AC)
- US-10 — Toggle Task Completion (all frontend AC)
- US-11 — Overdue Task Indicators (OverdueBadge rendering AC)
- US-12 — Manage Categories and Tags (all frontend AC)
- US-13 — Assign and Remove Tags from Tasks (CategoryPicker AC)

### UNIT-06: Backend — Search, Filter & Pagination
- US-14 — Search Tasks (all backend AC)
- US-15 — Filter Tasks (all backend AC)
- US-16 — Combined Filtering, Search, and Sorting (all backend AC)
- US-06 — View Task List (pagination AC + combined filter AC)
- US-18 — Manage Tasks via the REST API (filter/search query param AC)

### UNIT-07: Frontend — Search, Filter & Pagination UI
- US-14 — Search Tasks (all frontend AC)
- US-15 — Filter Tasks (all frontend AC)
- US-16 — Combined Filtering, Search, and Sorting (all frontend AC)
- US-06 — View Task List (full pagination + combined filter UI AC)

---

## Story Coverage Verification

| Epic | Stories | Covered By Units |
|---|---|---|
| E-01: Auth | US-01–04 | UNIT-02, UNIT-03 |
| E-02: Task Lifecycle | US-05–11 | UNIT-04, UNIT-05, UNIT-06, UNIT-07 |
| E-03: Organisation | US-12–13 | UNIT-04, UNIT-05 |
| E-04: Discovery | US-14–16 | UNIT-06, UNIT-07 |
| E-05: API Access | US-17–18 | UNIT-02, UNIT-04, UNIT-06 |

**All 18 stories accounted for. No gaps.**
