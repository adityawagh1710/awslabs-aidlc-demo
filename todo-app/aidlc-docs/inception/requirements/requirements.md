# Requirements — TODO List App

## Intent Analysis

- **User Request**: "I want to build a TODO list app"
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: System-wide (full-stack web application — frontend + backend + database)
- **Complexity Estimate**: Moderate-to-Complex (multi-user, authentication, full CRUD with filtering, production-grade)

---

## Functional Requirements

### FR-01: User Authentication & Account Management
- Users MUST be able to register a new account with email and password
- Users MUST be able to log in with email and password
- Users MUST be able to log out
- Sessions MUST expire after a configurable period of inactivity
- Each user's task data is private — not accessible to other users
- Users SHOULD be able to change their password

### FR-02: Task Management (CRUD)
- Users MUST be able to create a new task with at minimum: title, optional description
- Users MUST be able to view a list of all their tasks
- Users MUST be able to view the details of a single task
- Users MUST be able to update any field of an existing task
- Users MUST be able to delete a task
- Tasks MUST have a completion status (complete / incomplete) that can be toggled

### FR-03: Categories / Tags
- Users MUST be able to assign one or more categories or tags to a task
- Users MUST be able to create, rename, and delete their own categories/tags
- Filtering by category/tag MUST be supported (see FR-05)

### FR-04: Due Dates & Priorities
- Tasks MAY have an optional due date
- Tasks MUST have a priority level (e.g., Low / Medium / High)
- Overdue tasks (past due date, not completed) MUST be visually distinguishable in the UI
- Tasks SHOULD be sortable by due date and priority

### FR-05: Search & Filter
- Users MUST be able to search tasks by title or description (full-text or substring match)
- Users MUST be able to filter tasks by:
  - Completion status (all / active / completed)
  - Category/tag
  - Priority level
  - Due date range
- Filters SHOULD be combinable (e.g., High priority + incomplete + overdue)

### FR-06: Dashboard / List View
- The default view MUST show all of the user's tasks with key metadata (title, priority, due date, status, tags)
- The view MUST support sorting by: due date, priority, creation date, title
- Pagination or virtual scrolling MUST be implemented for large task lists

---

## Non-Functional Requirements

### NFR-01: Security
- Full security extension enforced (SECURITY-01 through SECURITY-15)
- Authentication uses secure password hashing (adaptive algorithm, e.g., bcrypt/argon2)
- All API endpoints require authentication except login and registration
- Object-level authorization enforced: users can only access their own tasks and categories
- HTTPS-only; HTTP Security Headers enforced (SECURITY-04)
- Input validation on all API endpoints (SECURITY-05)
- Rate limiting on authentication endpoints (SECURITY-11, SECURITY-12)
- No hardcoded credentials; secrets managed via environment variables or secrets manager

### NFR-02: Testing
- Full property-based testing extension enforced (PBT-01 through PBT-10)
- PBT framework: **fast-check** (integrates with Jest/Vitest for TypeScript)
- Unit tests for all business logic and data transformation functions
- Integration tests for API endpoints
- PBT for: serialization round-trips, task state invariants, filter/search logic, input validation
- Test coverage target: ≥ 80% line/branch coverage on backend business logic

### NFR-03: Performance
- API response time for task list (up to 500 tasks): < 500ms at p95
- Database queries MUST use indexed columns for filtering and sorting fields
- Frontend initial page load: < 3 seconds on standard broadband

### NFR-04: Reliability & Maintainability
- Application MUST have structured logging with correlation IDs (SECURITY-03)
- Application MUST have a global error handler; errors MUST NOT expose internals to clients
- Dependency lock file committed to version control (SECURITY-10)
- Code organized into clearly separated layers: routes / controllers / services / repositories

### NFR-05: Accessibility
- UI MUST meet WCAG 2.1 Level AA minimum
- All interactive elements MUST be keyboard-navigable
- Sufficient colour contrast for status indicators (priority, overdue)

---

## Technical Context

- **Application Type**: Web application (browser-based)
- **Frontend**: JavaScript / TypeScript — React (preferred) with a component library TBD (e.g., Tailwind CSS + shadcn/ui or similar)
- **Backend**: Node.js + TypeScript (REST API — Express or Fastify)
- **Database**: Relational preferred for structured task/user data — PostgreSQL recommended; SQLite acceptable for local development
- **ORM**: TBD during construction (e.g., Prisma, Drizzle, or TypeORM)
- **Authentication**: JWT-based session tokens or server-side sessions (to be decided in NFR design)
- **Hosting Target**: TBD — architecture should be cloud-deployable (containerized)

---

## Extension Configuration

| Extension | Status |
|---|---|
| Security Baseline (SECURITY-01 – SECURITY-15) | **Enabled** — enforced as blocking constraints |
| Property-Based Testing (PBT-01 – PBT-10) | **Enabled** — full enforcement |

---

## Out of Scope (for this version)

- Mobile application (native iOS/Android)
- Real-time collaboration / shared task lists
- Third-party integrations (calendar sync, Slack, etc.)
- Email notifications / reminders
- Admin dashboard or user management console
- Offline-first / PWA support
