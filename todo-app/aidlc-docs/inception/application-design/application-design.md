# Application Design — TODO List App (Consolidated)

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Repository structure | Two separate repos (`todo-backend`, `todo-frontend`) | Clean boundary enforcement; independent deployments |
| Frontend state management | Redux Toolkit + RTK Query | Full Redux ecosystem for global state; RTK Query for server data caching and API calls |
| Backend architecture | Layered: Controller → Service → Repository | Widely understood, fits REST APIs, clear separation of HTTP/business/data concerns |
| Backend HTTP framework | Fastify | High performance, built-in schema validation (JSON Schema), structured logging via pino, strong TypeScript support |
| API base path | `/api/v1/` | Versioned from the start; future-proofs breaking API changes |
| ORM | Prisma (to be confirmed in NFR Requirements) | Type-safe queries, migration management, PostgreSQL support |
| Authentication | JWT (stateless tokens) + server-side blacklist for logout | Stateless scalability with proper logout support |

---

## System Overview

```
+------------------+         HTTPS          +--------------------+
|  todo-frontend   |  ──────────────────>   |   todo-backend     |
|                  |  GET/POST/PUT/DELETE    |                    |
|  React SPA       |  /api/v1/*              |  Fastify + TS      |
|  Redux Toolkit   |  Authorization: Bearer  |  Layered arch.     |
|  RTK Query       |  <──────────────────    |  Prisma ORM        |
+------------------+   JSON responses        +----------+---------+
                                                        |
                                                        v
                                               +------------------+
                                               |   PostgreSQL     |
                                               |  (tables: users, |
                                               |  tasks,          |
                                               |  categories,     |
                                               |  task_categories,|
                                               |  token_blacklist)|
                                               +------------------+
```

---

## Backend Component Summary

### Layer 0: Domain Models
`User`, `Task`, `Category`, `TaskCategory`

### Layer 1: HTTP (Controllers + Fastify Plugins)
| Controllers | Plugins |
|---|---|
| `AuthController` | `AuthPlugin` (JWT preHandler) |
| `TaskController` | `RateLimitPlugin` |
| `CategoryController` | `SecurityHeadersPlugin` (fastify-helmet) |
| | `ValidationPlugin` (JSON Schema) |
| | `ErrorHandlerPlugin` |
| | `LoggerPlugin` (pino) |

### Layer 2: Services
`AuthService`, `TaskService`, `CategoryService`, `UserService`, `TokenService`

### Layer 3: Repositories
`UserRepository`, `TaskRepository`, `CategoryRepository`, `TaskCategoryRepository`, `TokenBlacklistRepository`

---

## Frontend Component Summary

### Redux Store
`authSlice` (auth state), `uiSlice` (filter/search/sort/page), `apiSlice` + `tasksApi` + `categoriesApi` + `authApi` (RTK Query)

### Pages
`LoginPage`, `RegisterPage`, `DashboardPage`, `TaskDetailPage`, `TaskFormPage`, `CategoryManagementPage`

### Feature Components
`TaskList`, `TaskCard`, `TaskForm`, `FilterBar`, `SearchInput`, `SortControls`, `CategoryPicker`, `CategoryManager`, `Pagination`

### Auth & Session
`LoginForm`, `RegisterForm`, `ProtectedRoute`, `SessionExpiryHandler`

### Shared UI
`AppShell`, `EmptyState`, `ConfirmDialog`, `Toast`, `ErrorBoundary`, `LoadingSpinner`, `OverdueBadge`

---

## Key Design Rules

1. **No controller-to-repository direct access** — controllers call services only
2. **IDOR enforced in service layer** — every service method that accesses a resource by ID verifies `resource.userId === request.user.id`
3. **Validation at HTTP boundary** — Fastify JSON Schema validates all request bodies and query params before reaching controllers
4. **Error normalization at error handler** — all errors converted to consistent JSON; stack traces and internal details never exposed
5. **Auth state in Redux** — components never read the JWT directly from storage; always via `authSlice.isAuthenticated` and `authSlice.token`
6. **Session expiry handled centrally** — `SessionExpiryHandler` in RTK Query baseQuery is the single place that reacts to 401 responses
7. **Category ownership double-checked on task mutation** — `TaskService` validates that assigned `categoryIds` belong to the same user as the task

---

## API Endpoint Summary

| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | `AuthController.register` |
| POST | `/api/v1/auth/login` | No | `AuthController.login` |
| POST | `/api/v1/auth/logout` | Yes | `AuthController.logout` |
| GET | `/api/v1/tasks` | Yes | `TaskController.listTasks` |
| POST | `/api/v1/tasks` | Yes | `TaskController.createTask` |
| GET | `/api/v1/tasks/:id` | Yes | `TaskController.getTask` |
| PUT | `/api/v1/tasks/:id` | Yes | `TaskController.updateTask` |
| DELETE | `/api/v1/tasks/:id` | Yes | `TaskController.deleteTask` |
| GET | `/api/v1/categories` | Yes | `CategoryController.listCategories` |
| POST | `/api/v1/categories` | Yes | `CategoryController.createCategory` |
| PUT | `/api/v1/categories/:id` | Yes | `CategoryController.updateCategory` |
| DELETE | `/api/v1/categories/:id` | Yes | `CategoryController.deleteCategory` |
