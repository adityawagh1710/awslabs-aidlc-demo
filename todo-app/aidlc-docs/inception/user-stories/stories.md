# User Stories — TODO List App

**Organization**: Epic-Based  
**Granularity**: Medium-grained  
**Acceptance Criteria format**: Checklist  
**Security**: Embedded in feature stories  
**Edge cases**: Full coverage  

---

## Epic E-01: User Authentication & Account Management

> Users can securely register, log in, and manage their sessions.

---

### US-01: Register a New Account
**As** Alex (Visitor),  
**I want** to create a new account using my email and password,  
**so that** I can start managing my personal task list.

**Acceptance Criteria:**
- [ ] Registration form requires: email address, password, password confirmation
- [ ] Email must be a valid format; invalid formats are rejected with a specific error message
- [ ] Password must be at least 8 characters; shorter passwords are rejected with a clear message
- [ ] Password and confirmation must match; mismatch is rejected with a clear message
- [ ] Duplicate email addresses are rejected with the message "An account with this email already exists"
- [ ] On success, the user is automatically logged in and redirected to their task dashboard
- [ ] Form data is preserved on validation error (email field retained; passwords cleared)
- [ ] Registration endpoint is rate-limited; after 10 failed attempts in 5 minutes, returns 429 with a `Retry-After` header
- [ ] Password is never stored in plaintext; stored using an adaptive hashing algorithm (bcrypt/argon2)
- [ ] No confirmation email is required for MVP (account is active immediately)

---

### US-02: Log In to an Existing Account
**As** Alex or Jordan,  
**I want** to log in with my email and password,  
**so that** I can access my private task list.

**Acceptance Criteria:**
- [ ] Login form requires: email address and password
- [ ] Correct credentials result in a session token being issued and the user being redirected to their task dashboard
- [ ] Incorrect email or password results in a generic error: "Invalid email or password" (does not reveal which field is wrong)
- [ ] Empty email or password fields are rejected before submission with inline validation messages
- [ ] After 5 consecutive failed login attempts from the same IP/account, a progressive delay or lockout is applied
- [ ] A locked account shows a message indicating it is temporarily locked; the error does not confirm whether the account exists
- [ ] Session token is stored securely (HttpOnly, Secure, SameSite=Strict cookie attributes)
- [ ] Visiting the login page while already authenticated redirects to the task dashboard
- [ ] "Remember me" is out of scope for MVP — sessions use a fixed server-side expiry

---

### US-03: Log Out
**As** Jordan,  
**I want** to log out of my account,  
**so that** my session is ended and my tasks are no longer accessible on this device.

**Acceptance Criteria:**
- [ ] A logout action is available from any authenticated page (e.g., top navigation)
- [ ] On logout, the server-side session is invalidated immediately (the token cannot be reused)
- [ ] The session cookie is cleared from the browser
- [ ] The user is redirected to the login page after logout
- [ ] Attempting to use a previously valid session token after logout returns 401 Unauthorized
- [ ] Logging out on one device does not affect sessions on other devices (per-token invalidation)

---

### US-04: Session Expiry Handling
**As** Jordan,  
**I want** to be informed when my session has expired,  
**so that** I can log back in without losing context of what I was doing.

**Acceptance Criteria:**
- [ ] Sessions expire after a configurable period of inactivity (default: 30 minutes)
- [ ] On any authenticated request with an expired token, the API returns 401 Unauthorized
- [ ] The frontend detects a 401 response and redirects to the login page with a message: "Your session has expired. Please log in again."
- [ ] After re-authentication, the user is returned to the page they were on when the session expired (if practical)
- [ ] An expired session that attempts to access another user's data still returns 401 (not 403 with user data leakage)

---

## Epic E-02: Task Lifecycle Management

> Authenticated users can create, view, update, complete, and delete their own tasks.

---

### US-05: Create a Task
**As** Jordan,  
**I want** to create a new task with relevant details,  
**so that** I can capture work that needs to be done before I forget it.

**Acceptance Criteria:**
- [ ] Task creation form includes: title (required), description (optional), priority (Low/Medium/High — default: Medium), due date (optional), category/tag assignment (optional)
- [ ] Title is required; submitting without a title shows an inline error: "Title is required"
- [ ] Title has a maximum length of 255 characters; exceeding it shows: "Title must be 255 characters or fewer"
- [ ] Description has a maximum length of 2000 characters
- [ ] Due date must be today or a future date; past dates are rejected with: "Due date must be today or in the future"
- [ ] On success, the new task appears in the task list and the user receives confirmation
- [ ] The new task belongs exclusively to the creating user — it cannot be accessed by any other authenticated user
- [ ] HTML and script content in title and description fields is escaped on save and display (XSS prevention)
- [ ] If the user has no categories yet, the category field is empty with a prompt to create one first

---

### US-06: View Task List
**As** Jordan,  
**I want** to see all my tasks in a clear, sortable list,  
**so that** I can get an overview of what I need to do and prioritize accordingly.

**Acceptance Criteria:**
- [ ] The task list shows all tasks belonging to the authenticated user
- [ ] Each task row displays: title, priority badge, due date (if set), completion status, category tags
- [ ] Overdue tasks (past due date, not complete) are visually highlighted (e.g., red due date)
- [ ] List supports sorting by: due date (ascending/descending), priority, creation date, title (A–Z)
- [ ] Default sort order is: incomplete tasks first, then by due date ascending
- [ ] When the user has no tasks, a friendly empty state is shown: "No tasks yet. Create your first task!"
- [ ] The list is paginated: 25 tasks per page; pagination controls are shown when more than 25 tasks exist
- [ ] A user cannot retrieve tasks belonging to another user (API enforces ownership; returns only the authenticated user's tasks)
- [ ] The API response does not include any fields from other users' tasks

---

### US-07: View Task Details
**As** Jordan,  
**I want** to open a task to see its full details,  
**so that** I can read the complete description and check all metadata.

**Acceptance Criteria:**
- [ ] Clicking a task in the list opens a detail view showing: title, full description, priority, due date, completion status, assigned categories, created date, last updated date
- [ ] Requesting a task that belongs to a different user returns 403 Forbidden (not 404, to prevent enumeration)
- [ ] Requesting a task with an ID that does not exist returns 404 Not Found
- [ ] The detail view has navigation back to the task list

---

### US-08: Edit a Task
**As** Jordan,  
**I want** to update any field of an existing task,  
**so that** I can correct mistakes or refine task details as circumstances change.

**Acceptance Criteria:**
- [ ] The task detail view or list includes an edit action (button or inline)
- [ ] All fields from task creation are editable: title, description, priority, due date, categories
- [ ] The same validation rules from creation apply on edit (required title, max lengths, valid due date)
- [ ] On save, the task's "last updated" timestamp is refreshed
- [ ] Only the task's owner can edit it; other authenticated users receive 403 Forbidden
- [ ] A user editing their own task cannot change the task's owner
- [ ] Concurrent edit conflict (optimistic locking) is out of scope for MVP

---

### US-09: Delete a Task
**As** Jordan,  
**I want** to delete a task I no longer need,  
**so that** my list stays clean and relevant.

**Acceptance Criteria:**
- [ ] A delete action is available from the task detail view and the task list
- [ ] Deleting requires a confirmation step ("Are you sure you want to delete this task? This cannot be undone.")
- [ ] On confirmation, the task is permanently deleted and removed from the list
- [ ] Only the task's owner can delete it; other authenticated users receive 403 Forbidden
- [ ] Attempting to delete a task that does not exist (already deleted) returns 404 Not Found
- [ ] Deleting a task also removes its category associations (no orphaned join records)

---

### US-10: Toggle Task Completion
**As** Jordan,  
**I want** to mark a task as complete or reopen it,  
**so that** I can track my progress without deleting finished work.

**Acceptance Criteria:**
- [ ] Each task in the list and detail view has a completion toggle (checkbox or button)
- [ ] Toggling completion updates the task's status immediately (optimistic UI update)
- [ ] Completed tasks are visually distinguished (strikethrough title, greyed appearance)
- [ ] A completed task can be reopened (marked incomplete) at any time
- [ ] Only the task's owner can toggle its completion status; others receive 403 Forbidden
- [ ] Completion timestamp is recorded when a task is first marked complete

---

### US-11: Overdue Task Indicators
**As** Jordan,  
**I want** to immediately see which of my tasks are overdue,  
**so that** I can reprioritize and address missed deadlines quickly.

**Acceptance Criteria:**
- [ ] A task is "overdue" if its due date is in the past AND it is not marked complete
- [ ] Overdue tasks display a visual indicator (e.g., red due date label, "Overdue" badge)
- [ ] Completed tasks are never shown as overdue, even if their due date has passed
- [ ] The overdue calculation is based on the server's date at request time (not client clock)
- [ ] A task due today is NOT shown as overdue (only strictly past dates count)

---

## Epic E-03: Organisation & Categorisation

> Users can create and manage their own categories/tags and assign them to tasks.

---

### US-12: Manage Categories and Tags
**As** Jordan,  
**I want** to create, rename, and delete my own categories,  
**so that** I can group tasks by meaningful areas (e.g., Work, Personal, Shopping).

**Acceptance Criteria:**
- [ ] A categories management screen lists all categories belonging to the authenticated user
- [ ] User can create a new category with a name (required, max 50 characters)
- [ ] Duplicate category names for the same user are rejected: "You already have a category with this name"
- [ ] User can rename a category; the new name is subject to the same uniqueness and length rules
- [ ] User can delete a category; tasks previously assigned that category lose the association but are not deleted
- [ ] Only the owner can view, edit, or delete their categories; other users' categories are not accessible
- [ ] When the user has no categories, an empty state is shown with a prompt to create one
- [ ] Category names are escaped for display to prevent XSS

---

### US-13: Assign and Remove Tags from Tasks
**As** Jordan,  
**I want** to assign one or more of my categories to a task and remove them,  
**so that** I can organise tasks across multiple dimensions (e.g., a task that is both Work and Urgent).

**Acceptance Criteria:**
- [ ] The task creation and edit forms allow selecting zero or more of the user's existing categories
- [ ] A task can have zero or many categories assigned
- [ ] Only categories belonging to the authenticated user are shown for selection (no cross-user category exposure)
- [ ] Removing a category from a task preserves the task and the category
- [ ] Assigning a category that does not belong to the user returns 403 Forbidden (API-level enforcement)

---

## Epic E-04: Discovery — Search & Filter

> Users can quickly find tasks using search and combinable filters.

---

### US-14: Search Tasks
**As** Jordan,  
**I want** to search my tasks by title or description keyword,  
**so that** I can quickly find a specific task without scrolling through the entire list.

**Acceptance Criteria:**
- [ ] A search input is prominently accessible from the task list view
- [ ] Search matches tasks where the title or description contains the query string (case-insensitive, substring match)
- [ ] Search results are scoped to the authenticated user's tasks only (never returns another user's tasks)
- [ ] Results update on submit (not on every keystroke for MVP)
- [ ] If no tasks match the query, a "No tasks found matching '[query]'" message is shown
- [ ] Searching with an empty string returns all tasks (effectively resets the search)
- [ ] Search query inputs are sanitized to prevent injection; the query is parameterized at the database layer

---

### US-15: Filter Tasks
**As** Jordan,  
**I want** to filter my task list by status, category, priority, and due date range,  
**so that** I can focus on the subset of tasks most relevant to what I'm doing now.

**Acceptance Criteria:**
- [ ] Filter controls are accessible from the task list view
- [ ] Available filters: completion status (All / Active / Completed), category (multi-select from user's categories), priority (Low / Medium / High — multi-select), due date range (from date, to date — both optional)
- [ ] Filters are applied on demand (apply button or auto-apply per filter — consistent behaviour)
- [ ] Filters are scoped exclusively to the authenticated user's tasks
- [ ] When no tasks match the active filters, an empty state is shown: "No tasks match the current filters."
- [ ] A "Clear filters" control resets all filters and returns the full task list
- [ ] Filtering with a date range where "from" is after "to" is rejected with an inline error

---

### US-16: Combined Filtering, Search, and Sorting
**As** Jordan,  
**I want** to combine search, filters, and sort simultaneously,  
**so that** I can precisely locate and prioritise tasks in complex situations (e.g., "Show me high-priority, incomplete work tasks due this week, sorted by due date").

**Acceptance Criteria:**
- [ ] Search, filter, and sort controls can all be active simultaneously
- [ ] Results satisfy all active criteria (logical AND across all active filters + search)
- [ ] The active filter and search state is visible (e.g., filter chips or summary bar)
- [ ] Pagination applies to the combined filtered/searched result set (not to the full unfiltered set)
- [ ] Removing one filter updates results while preserving the remaining active filters and search term
- [ ] When combined filters + search return zero results, the empty state message reflects the active criteria
- [ ] Sort order is maintained when filters or search are changed

---

## Epic E-05: API Access

> Technical users can authenticate and manage tasks programmatically via the REST API.

---

### US-17: Authenticate via the REST API
**As** Casey (API Consumer),  
**I want** to obtain an authentication token via the API,  
**so that** I can make authenticated requests to manage tasks programmatically.

**Acceptance Criteria:**
- [ ] `POST /api/auth/login` accepts `{ "email": "...", "password": "..." }` and returns a signed JWT on success
- [ ] The JWT includes: user ID, issued-at timestamp, expiry timestamp, and audience/issuer claims
- [ ] The JWT signature is verified server-side on every authenticated request
- [ ] Using an expired or malformed JWT returns `401 Unauthorized` with a JSON error body: `{ "error": "Unauthorized", "message": "Token is invalid or expired" }`
- [ ] The API never exposes the user's password or password hash in any response
- [ ] `POST /api/auth/logout` invalidates the current token server-side (token blacklisting or short-lived tokens with refresh)
- [ ] All API error responses use a consistent JSON structure: `{ "error": "<type>", "message": "<description>" }`
- [ ] Login endpoint is rate-limited; after repeated failures, returns `429 Too Many Requests` with `Retry-After` header
- [ ] Attempting to access a protected endpoint without a token returns `401 Unauthorized` (not a redirect)

---

### US-18: Manage Tasks via the REST API
**As** Casey (API Consumer),  
**I want** to perform all task operations via structured REST API endpoints,  
**so that** I can integrate the TODO app into my own tools and automation workflows.

**Acceptance Criteria:**
- [ ] All task endpoints require a valid JWT in the `Authorization: Bearer <token>` header; missing or invalid tokens return 401
- [ ] `GET /api/tasks` returns a paginated list of the authenticated user's tasks only (never another user's tasks)
- [ ] `POST /api/tasks` creates a task owned by the authenticated user; the owner ID is set server-side (not from request body)
- [ ] `GET /api/tasks/:id` returns 403 if the task belongs to a different user; 404 if it does not exist
- [ ] `PUT /api/tasks/:id` returns 403 if the task belongs to a different user; applies the same validation rules as creation
- [ ] `DELETE /api/tasks/:id` returns 403 if the task belongs to a different user; 404 if it does not exist; 204 on success
- [ ] `GET /api/tasks` supports query parameters for search, filter (status, priority, category, date range), and sort, matching the UI behaviour
- [ ] All responses use `Content-Type: application/json`
- [ ] Validation errors return `400 Bad Request` with a JSON body listing each invalid field: `{ "error": "ValidationError", "fields": { "title": "Title is required" } }`
- [ ] The API does not accept or return HTML content; all inputs are validated against expected types and lengths
- [ ] API response bodies never include another user's data in any field

---

## Story Summary

| Story ID | Epic | Title | Personas |
|---|---|---|---|
| US-01 | E-01 | Register a New Account | Alex |
| US-02 | E-01 | Log In to an Existing Account | Alex, Jordan |
| US-03 | E-01 | Log Out | Jordan |
| US-04 | E-01 | Session Expiry Handling | Jordan |
| US-05 | E-02 | Create a Task | Jordan |
| US-06 | E-02 | View Task List | Jordan |
| US-07 | E-02 | View Task Details | Jordan |
| US-08 | E-02 | Edit a Task | Jordan |
| US-09 | E-02 | Delete a Task | Jordan |
| US-10 | E-02 | Toggle Task Completion | Jordan |
| US-11 | E-02 | Overdue Task Indicators | Jordan |
| US-12 | E-03 | Manage Categories and Tags | Jordan |
| US-13 | E-03 | Assign and Remove Tags from Tasks | Jordan |
| US-14 | E-04 | Search Tasks | Jordan |
| US-15 | E-04 | Filter Tasks | Jordan |
| US-16 | E-04 | Combined Filtering, Search, and Sorting | Jordan |
| US-17 | E-05 | Authenticate via the REST API | Casey |
| US-18 | E-05 | Manage Tasks via the REST API | Casey |

## PBT-Relevant Properties Identified (for Functional Design)

The following stories surface properties that should be covered by property-based tests (per PBT-01):

| Story | Property Category | Description |
|---|---|---|
| US-06 / US-18 | Invariant | Filtering never returns tasks belonging to a different user |
| US-16 | Invariant | Combined filter results are always a subset of any single filter's results |
| US-06 | Invariant | Pagination preserves total task count across pages |
| US-14 | Invariant | Search with empty string returns the same set as no search |
| US-10 | Idempotence | Toggling completion twice returns task to original state |
| US-09 | Invariant | Deleting a task removes exactly one record; total count decreases by one |
| US-05 / US-08 | Invariant | Title field always satisfies max-length constraint after save |
| US-17 | Round-trip | JWT encode → decode → verify round-trip preserves user ID and claims |
