# Component Dependencies — TODO List App

---

## Backend Dependency Graph

```
HTTP Requests
     |
     v
[Fastify Plugins: AuthPlugin, RateLimitPlugin, SecurityHeadersPlugin, ValidationPlugin, LoggerPlugin]
     |
     v
[Controllers: AuthController | TaskController | CategoryController]
     |          |                    |
     v          v                    v
[AuthService] [TaskService]   [CategoryService]
     |    \       |    \           |
     |     \      |     \          |
     v      v     v      v         v
[UserSvc] [TokenSvc] [TaskRepo] [CategoryRepo] [TaskCategoryRepo] [TokenBlacklistRepo]
                                     |               |
                                     v               v
                              [PostgreSQL via Prisma ORM]
```

### Backend Dependency Matrix

| Component | Depends On |
|---|---|
| `AuthController` | `AuthService` |
| `TaskController` | `TaskService` |
| `CategoryController` | `CategoryService` |
| `AuthService` | `UserService`, `TokenService` |
| `TaskService` | `TaskRepository`, `TaskCategoryRepository`, `CategoryRepository` |
| `CategoryService` | `CategoryRepository`, `TaskCategoryRepository` |
| `UserService` | `UserRepository` |
| `TokenService` | `TokenBlacklistRepository` |
| `AuthPlugin` | `TokenService` |
| `All Repositories` | Prisma ORM client (injected) |

**Rules:**
- Controllers MUST NOT import Repositories directly — always via Services
- Services MUST NOT import other Services' repositories — only their own
- Exception: `TaskService` may read `CategoryRepository` to validate category ownership during task create/update

---

## Frontend Dependency Graph

```
Browser
  |
  v
[React Router] → [ProtectedRoute] → [AppShell]
                                        |
                    ┌───────────────────┼───────────────────┐
                    v                   v                   v
             [DashboardPage]   [TaskDetailPage]   [CategoryManagementPage]
                    |                   |                   |
            ┌───────┴───────┐           |                   |
            v               v           v                   v
       [FilterBar]     [TaskList]  [TaskForm]        [CategoryManager]
       [SearchInput]       |       [CategoryPicker]
       [SortControls]  [TaskCard]
                       [OverdueBadge]
                       [Pagination]

All page components ←→ Redux Store (authSlice, uiSlice)
All data fetching   ←→ RTK Query (tasksApi, categoriesApi, authApi)
RTK Query          ←→ SessionExpiryHandler (401 intercept) → authSlice.clearCredentials
```

### Frontend Dependency Matrix

| Component | Depends On |
|---|---|
| `LoginPage`, `RegisterPage` | `authApi` (RTK Query), `authSlice` |
| `DashboardPage` | `uiSlice`, `tasksApi`, `TaskList`, `FilterBar`, `SearchInput`, `SortControls` |
| `TaskDetailPage` | `tasksApi`, `TaskForm`, `ConfirmDialog` |
| `TaskFormPage` | `tasksApi`, `categoriesApi`, `TaskForm`, `CategoryPicker` |
| `CategoryManagementPage` | `categoriesApi`, `CategoryManager` |
| `TaskList` | `tasksApi`, `TaskCard`, `Pagination`, `EmptyState` |
| `TaskCard` | `OverdueBadge`, `ConfirmDialog` |
| `TaskForm` | `categoriesApi`, `CategoryPicker` |
| `FilterBar` | `categoriesApi`, `uiSlice` |
| `ProtectedRoute` | `authSlice` |
| `SessionExpiryHandler` | `authSlice`, React Router navigate |
| `AppShell` | `authSlice`, `authApi` |
| All RTK Query hooks | `apiSlice` (base), `SessionExpiryHandler` |

---

## Inter-Repository Communication

**Two separate repositories** — communication is via HTTP REST API only.

```
todo-frontend  ──HTTP/HTTPS──>  todo-backend
               GET/POST/PUT/DELETE /api/v1/*
               Authorization: Bearer <JWT>
               Content-Type: application/json
```

- No shared code between repos at runtime (no npm workspace for shared types in MVP)
- Frontend TypeScript types (DTOs) are maintained in the frontend repo, aligned manually with backend schemas
- Future: extract shared types to a `todo-shared` npm package if schema drift becomes a problem

---

## Data Flow: Task List with Filters

```
User interacts with FilterBar/SearchInput/SortControls
        |
        v
uiSlice dispatched (setFilters / setSearchQuery / setSortOrder / setCurrentPage)
        |
        v
DashboardPage reads combined state → passes to useGetTasksQuery(filters)
        |
        v   [HTTP GET /api/v1/tasks?status=active&priority=High&search=...&page=1]
        |
todo-backend:
  AuthPlugin validates JWT
  TaskController.listTasks()
  TaskService.listTasks(userId, filters)
  TaskRepository.findAll() [parameterized SQL query]
        |
        v
  PaginatedResult<Task> → JSON response
        |
        v
RTK Query cache updated → TaskList re-renders → TaskCard[] displayed
```

---

## Security Boundary Enforcement Points

| Boundary | Enforcement |
|---|---|
| Unauthenticated → protected routes (frontend) | `ProtectedRoute` checks `authSlice.isAuthenticated` |
| Expired/invalid session (frontend) | `SessionExpiryHandler` in RTK Query baseQuery |
| Missing/invalid JWT (backend) | `AuthPlugin` preHandler on every protected route |
| Cross-user resource access (backend) | `TaskService` and `CategoryService` compare `resource.userId` to `request.user.id` |
| Cross-user category in task (backend) | `TaskService.createTask/updateTask` validates category ownership before assignment |
