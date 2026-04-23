# Components — TODO List App

**Repository layout**: Two separate repositories — `todo-backend` and `todo-frontend`  
**Backend style**: Layered — HTTP → Service → Repository  
**Frontend style**: React + Redux Toolkit + RTK Query  

---

## Backend Repository: `todo-backend`

### Layer 0: Domain Models

| Component | Type | Responsibility |
|---|---|---|
| `User` | Domain model | Represents a registered user. Fields: id, email, passwordHash, createdAt, updatedAt |
| `Task` | Domain model | Represents a task owned by a user. Fields: id, userId, title, description, priority (Low/Medium/High), dueDate, completedAt, createdAt, updatedAt |
| `Category` | Domain model | Represents a user-owned tag/category. Fields: id, userId, name, createdAt, updatedAt |
| `TaskCategory` | Join model | Many-to-many association between Task and Category. Fields: taskId, categoryId |

---

### Layer 1: HTTP Layer (Routes + Controllers)

| Component | Responsibility |
|---|---|
| `AuthController` | Handles HTTP for `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`. Validates request shape; delegates to `AuthService`; formats responses. |
| `TaskController` | Handles HTTP for `GET/POST /api/v1/tasks` and `GET/PUT/DELETE /api/v1/tasks/:id`. Parses query params (filters, sort, pagination); delegates to `TaskService`; enforces ownership via middleware. |
| `CategoryController` | Handles HTTP for `GET/POST /api/v1/categories` and `GET/PUT/DELETE /api/v1/categories/:id`. Delegates to `CategoryService`. |

---

### Layer 2: Service Layer

| Component | Responsibility |
|---|---|
| `AuthService` | Business logic for user registration (hashing, uniqueness), login (credential verification, token issuance), logout (token invalidation). Owns password policy enforcement. |
| `TaskService` | Business logic for task CRUD, ownership verification (IDOR prevention), overdue calculation, filter/search/sort query building, pagination. |
| `CategoryService` | Business logic for category CRUD, ownership verification, name uniqueness per user, cascade disassociation on delete. |
| `UserService` | User lookup by ID and email. Used internally by `AuthService` and middleware. |
| `TokenService` | JWT creation, signing, verification, and blacklisting (token invalidation on logout). |

---

### Layer 3: Repository Layer

| Component | Responsibility |
|---|---|
| `UserRepository` | Database access for User records. Methods: find by ID, find by email, create, update. |
| `TaskRepository` | Database access for Task records. Supports filtered/searched/sorted/paginated queries. Methods: findAll (with filters), findById, create, update, delete, countAll. |
| `CategoryRepository` | Database access for Category records. Methods: findAllByUser, findById, create, update, delete. |
| `TaskCategoryRepository` | Database access for TaskCategory join records. Methods: setCategories (replace all), addCategory, removeCategory, findCategoriesForTask. |
| `TokenBlacklistRepository` | Stores invalidated JWT IDs (jti) until their natural expiry. Used by `TokenService` to check logout state. |

---

### Cross-Cutting: Fastify Plugins & Middleware

| Component | Type | Responsibility |
|---|---|---|
| `AuthPlugin` | Fastify plugin / preHandler hook | Validates JWT on every protected route. Extracts `userId` from token and attaches to `request.user`. Returns 401 if missing, expired, or blacklisted. |
| `RateLimitPlugin` | Fastify plugin (fastify-rate-limit) | Applies per-route rate limits: strict on auth endpoints (login, register), relaxed on data endpoints. |
| `SecurityHeadersPlugin` | Fastify plugin (fastify-helmet) | Sets all required HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy). |
| `ValidationPlugin` | Fastify built-in (JSON Schema) | Schema-based request validation for all routes. Returns 400 with structured field errors on validation failure. |
| `ErrorHandlerPlugin` | Fastify setErrorHandler | Global error handler. Maps domain errors to HTTP responses. Ensures no stack traces or internal details reach clients. |
| `LoggerPlugin` | Fastify built-in (pino) | Structured JSON logging with correlation IDs (request ID) on every request. Redacts sensitive fields (passwords, tokens). |

---

## Frontend Repository: `todo-frontend`

### Redux Store

| Component | Type | Responsibility |
|---|---|---|
| `authSlice` | Redux slice | Stores authentication state: `{ token, user: { id, email }, isAuthenticated }`. Actions: `setCredentials`, `clearCredentials`. |
| `uiSlice` | Redux slice | Stores cross-component UI state: `{ activeFilters, sortOrder, currentPage, searchQuery }`. |
| `apiSlice` (RTK Query) | RTK Query base API | Configured base API with `baseUrl`, auth header injection, and 401 response handling (triggers logout). All endpoint definitions extend this. |
| `tasksApi` | RTK Query endpoints | `getTasks`, `getTaskById`, `createTask`, `updateTask`, `deleteTask`, `toggleTaskCompletion`. Auto-generates hooks. |
| `categoriesApi` | RTK Query endpoints | `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`. Auto-generates hooks. |
| `authApi` | RTK Query endpoints | `login`, `register`, `logout`. Auto-generates hooks. |

---

### Page Components (Route-level)

| Component | Route | Responsibility |
|---|---|---|
| `LoginPage` | `/login` | Renders `LoginForm`. Redirects to dashboard if already authenticated. |
| `RegisterPage` | `/register` | Renders `RegisterForm`. Redirects to dashboard if already authenticated. |
| `DashboardPage` | `/` | Renders `FilterBar`, `SearchInput`, `SortControls`, `TaskList`. Reads filter/search/sort state from Redux. |
| `TaskDetailPage` | `/tasks/:id` | Renders full task detail. Fetches task by ID. Shows edit/delete actions. |
| `TaskFormPage` | `/tasks/new`, `/tasks/:id/edit` | Renders `TaskForm` in create or edit mode. |
| `CategoryManagementPage` | `/categories` | Renders `CategoryManager` for CRUD on user's categories. |

---

### Feature Components

| Component | Responsibility |
|---|---|
| `TaskList` | Renders list of `TaskCard` components. Shows `EmptyState` when no tasks. Shows `Pagination` controls. |
| `TaskCard` | Single task row: title, priority badge, due date (overdue highlight if applicable), status toggle, tags, edit/delete actions. |
| `TaskForm` | Create/edit form: title, description, priority select, due date picker, `CategoryPicker`. Client-side validation matching backend rules. |
| `FilterBar` | Filter controls: status (All/Active/Completed), priority multi-select, category multi-select, date range pickers. Dispatches filter state to `uiSlice`. |
| `SearchInput` | Search text box. Dispatches search query to `uiSlice` on submit. |
| `SortControls` | Sort dropdown/buttons. Dispatches sort order to `uiSlice`. |
| `CategoryPicker` | Multi-select input for assigning categories to a task. Fetches user's categories via RTK Query. |
| `CategoryManager` | CRUD list for categories: shows all categories, inline rename, delete with confirmation. |
| `Pagination` | Page navigation controls. Reads `currentPage` and `totalPages` from task list response. |

---

### Auth & Session Components

| Component | Responsibility |
|---|---|
| `LoginForm` | Email + password form. Dispatches `login` mutation. On success, stores credentials via `authSlice.setCredentials` and navigates to dashboard. |
| `RegisterForm` | Email + password + confirm form. Dispatches `register` mutation. On success, auto-logs in. |
| `ProtectedRoute` | HOC wrapper for authenticated routes. Reads `isAuthenticated` from `authSlice`; redirects to `/login` if false. |
| `SessionExpiryHandler` | RTK Query `baseQuery` wrapper. Intercepts 401 responses: dispatches `clearCredentials`, redirects to `/login` with expiry message. |

---

### Shared / UI Components

| Component | Responsibility |
|---|---|
| `AppShell` | Top-level layout: navigation bar (user name, logout button), main content area. |
| `EmptyState` | Friendly placeholder when a list is empty. Accepts custom title and description. |
| `ConfirmDialog` | Modal confirmation dialog. Used for delete actions. |
| `Toast / Notification` | Ephemeral success/error notifications. Triggered by RTK Query mutation outcomes. |
| `ErrorBoundary` | React error boundary at app root. Catches unhandled render errors, shows generic error page, logs to console in development. |
| `LoadingSpinner` | Loading indicator used while RTK Query requests are in-flight. |
| `OverdueBadge` | Visual indicator shown on tasks where `dueDate < today && !completedAt`. |
