# Units of Work — TODO List App

**Decomposition strategy**: Interleaved — Backend unit N → Frontend unit N → Backend unit N+1  
**Total units**: 7  
**Repositories**: `todo-backend` (Units 1–2, 4, 6) | `todo-frontend` (Units 3, 5, 7)

---

## Development Sequence

```
UNIT-01  DB & Infrastructure Foundation     (todo-backend repo setup)
   |
UNIT-02  Backend — Auth & User Management   (todo-backend)
   |
UNIT-03  Frontend — Auth UI                 (todo-frontend)
   |
UNIT-04  Backend — Task CRUD & Categories   (todo-backend)
   |
UNIT-05  Frontend — Task CRUD & Categories UI  (todo-frontend)
   |
UNIT-06  Backend — Search, Filter & Pagination (todo-backend)
   |
UNIT-07  Frontend — Search, Filter & Pagination UI (todo-frontend)
```

---

## UNIT-01: Database & Infrastructure Foundation

**Repository**: `todo-backend`  
**Type**: Infrastructure  
**Depends on**: Nothing — this is the root unit

### Responsibilities
- PostgreSQL database setup (Docker Compose for local development)
- Prisma ORM initialisation and schema definition (all tables: users, tasks, categories, task_categories, token_blacklist)
- Initial Prisma migration files
- Fastify server scaffold (entry point, plugin registration skeleton, health check endpoint)
- Environment configuration (`.env.example`, config loader module)
- TypeScript project setup (`tsconfig.json`, ESLint, Prettier)
- CI pipeline skeleton (GitHub Actions or equivalent: lint, type-check, test, build)
- Docker configuration (`Dockerfile` for the backend, `.dockerignore`)

### Code Organisation — `todo-backend/`
```
todo-backend/
├── src/
│   ├── app.ts                  # Fastify app factory
│   ├── server.ts               # Entry point (start server)
│   ├── config/
│   │   └── env.ts              # Validated env config
│   ├── plugins/                # Fastify plugins (registered in app.ts)
│   │   ├── auth.ts             # AuthPlugin (JWT preHandler)
│   │   ├── error-handler.ts    # Global error handler
│   │   ├── rate-limit.ts
│   │   ├── security-headers.ts
│   │   └── logger.ts
│   ├── routes/                 # Route registration (controllers live here)
│   │   ├── auth.routes.ts
│   │   ├── tasks.routes.ts
│   │   └── categories.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── tasks.controller.ts
│   │   └── categories.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── task.service.ts
│   │   ├── category.service.ts
│   │   ├── user.service.ts
│   │   └── token.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── task.repository.ts
│   │   ├── category.repository.ts
│   │   ├── task-category.repository.ts
│   │   └── token-blacklist.repository.ts
│   ├── domain/
│   │   └── errors.ts           # Domain error classes (NotFoundError, ForbiddenError, etc.)
│   └── types/
│       └── fastify.d.ts        # Augment FastifyRequest with request.user
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── property/               # fast-check PBT tests
├── .env.example
├── Dockerfile
├── docker-compose.yml          # PostgreSQL + backend service
├── package.json
└── tsconfig.json
```

### Deliverables
- Running `docker-compose up` starts PostgreSQL and the Fastify server (health check returns 200)
- `GET /health` endpoint returns `{ "status": "ok" }`
- All Prisma models defined; `prisma migrate dev` runs clean
- TypeScript compiles with no errors; lint passes

---

## UNIT-02: Backend — Auth & User Management

**Repository**: `todo-backend`  
**Type**: Feature — Backend  
**Depends on**: UNIT-01

### Responsibilities
- `UserRepository` — findById, findByEmail, create
- `TokenBlacklistRepository` — add, isBlacklisted, pruneExpired
- `TokenService` — JWT sign, verify, invalidate, isBlacklisted
- `UserService` — findById, findByEmail, create
- `AuthService` — register, login, logout (with password hashing + brute-force tracking)
- `AuthPlugin` — JWT preHandler for all protected routes
- `AuthController` + routes: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`
- `RateLimitPlugin` — strict limits on auth endpoints
- Input validation schemas for all auth routes
- Unit tests + integration tests + PBT (JWT round-trip, password hash properties)

### Stories Covered
US-01, US-02, US-03, US-04, US-17 (API auth portion)

---

## UNIT-03: Frontend — Auth UI

**Repository**: `todo-frontend`  
**Type**: Feature — Frontend  
**Depends on**: UNIT-02 (live auth API endpoints)

### Responsibilities
- `todo-frontend` repo scaffold: Vite + React + TypeScript, ESLint, Prettier, Tailwind CSS (or chosen CSS framework)
- Redux store setup: `store.ts`, `authSlice`, `apiSlice` (RTK Query base)
- `authApi` RTK Query endpoints (login, register, logout)
- `SessionExpiryHandler` — 401 intercept in baseQuery
- `ProtectedRoute` component
- `LoginPage` + `LoginForm`
- `RegisterPage` + `RegisterForm`
- `AppShell` (skeleton: nav bar with logout, main content area)
- React Router setup with `/login`, `/register`, `/` routes
- `Toast` / notification component for auth errors
- `ErrorBoundary` at app root

### Code Organisation — `todo-frontend/`
```
todo-frontend/
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Router + providers
│   ├── store/
│   │   ├── index.ts            # Redux store config
│   │   ├── authSlice.ts
│   │   ├── uiSlice.ts
│   │   └── api/
│   │       ├── apiSlice.ts     # RTK Query base
│   │       ├── authApi.ts
│   │       ├── tasksApi.ts     # Stubbed in UNIT-03, implemented in UNIT-05
│   │       └── categoriesApi.ts
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── layout/
│   │   │   └── AppShell.tsx
│   │   └── shared/
│   │       ├── ProtectedRoute.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Toast.tsx
│   │       └── LoadingSpinner.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── DashboardPage.tsx   # Placeholder — implemented in UNIT-05
│   └── types/
│       └── api.ts              # Shared DTO types
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Deliverables
- Register → auto-login → redirect to dashboard (placeholder) works end-to-end
- Login with valid credentials issues JWT and stores in `authSlice`
- 401 response clears auth state and redirects to `/login` with expiry message
- Logout invalidates server token and clears Redux state

### Stories Covered
US-01, US-02, US-03, US-04

---

## UNIT-04: Backend — Task CRUD & Categories

**Repository**: `todo-backend`  
**Type**: Feature — Backend  
**Depends on**: UNIT-02 (AuthPlugin, UserRepository, domain errors)

### Responsibilities
- `TaskRepository` — findAll (no filter/search yet, basic list only), findById, create, update, delete
- `TaskCategoryRepository` — setCategories, findCategoriesForTask, removeAllForCategory
- `CategoryRepository` — findAllByUser, findById, findByNameAndUser, create, update, delete
- `TaskService` — CRUD + IDOR checks + overdue calculation + category ownership validation
- `CategoryService` — CRUD + IDOR checks + cascade disassociation on delete
- `TaskController` + routes: `GET /api/v1/tasks` (basic, no filter), `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- `CategoryController` + routes: all category endpoints
- Prisma queries for all task and category operations
- Input validation schemas for task and category routes
- Unit tests + integration tests + PBT (task invariants, category ownership)

### Stories Covered
US-05, US-06 (basic list, no search/filter/pagination), US-07, US-08, US-09, US-10, US-11, US-12, US-13, US-18

---

## UNIT-05: Frontend — Task CRUD & Categories UI

**Repository**: `todo-frontend`  
**Type**: Feature — Frontend  
**Depends on**: UNIT-03 (auth, store, routing) + UNIT-04 (task/category API)

### Responsibilities
- `tasksApi` RTK Query endpoints (getTasks, getTaskById, createTask, updateTask, deleteTask, toggleTaskCompletion)
- `categoriesApi` RTK Query endpoints (getCategories, createCategory, updateCategory, deleteCategory)
- `uiSlice` — sort state (filter state added in UNIT-07)
- `DashboardPage` (task list with basic sort; filter/search controls added in UNIT-07)
- `TaskList`, `TaskCard`, `OverdueBadge`, `Pagination` (basic — full pagination in UNIT-07)
- `TaskDetailPage`, `TaskFormPage`, `TaskForm`, `CategoryPicker`
- `CategoryManagementPage`, `CategoryManager`
- `ConfirmDialog` (delete confirmation)
- `SortControls` (basic sort by due date, priority, created date)

### Stories Covered
US-05, US-06 (basic list + sort), US-07, US-08, US-09, US-10, US-11, US-12, US-13

---

## UNIT-06: Backend — Search, Filter & Pagination

**Repository**: `todo-backend`  
**Type**: Feature — Backend  
**Depends on**: UNIT-04 (TaskRepository, TaskService)

### Responsibilities
- Extend `TaskRepository.findAll()` with: full-text/substring search (title + description), filter by status/priority/categoryIds/date range, sort by all supported fields, offset-based pagination (page + pageSize + total count)
- Extend `TaskService.listTasks()` to pass filter/pagination input to repository
- Update `TaskController.listTasks()` query-string parsing and validation schema
- Database indexes: add indexes on `tasks(userId, dueDate, priority, completedAt)` and full-text or ILIKE search support
- Unit tests + integration tests + PBT (filter invariants: results always subset of user's tasks; combined filter correctness; pagination total count invariant)

### Stories Covered
US-14, US-15, US-16, US-06 (pagination + filtering)

---

## UNIT-07: Frontend — Search, Filter & Pagination UI

**Repository**: `todo-frontend`  
**Type**: Feature — Frontend  
**Depends on**: UNIT-05 (task UI, uiSlice) + UNIT-06 (search/filter/pagination API)

### Responsibilities
- Extend `uiSlice` with filter state (status, priority, categoryIds, dueDateFrom, dueDateTo, searchQuery, currentPage)
- `FilterBar` component — status toggle, priority multi-select, category multi-select, date range pickers
- `SearchInput` component
- Update `DashboardPage` to wire FilterBar, SearchInput, and SortControls into `useGetTasksQuery`
- Full `Pagination` component with page navigation
- Empty state messages for no-results scenarios
- Active filter summary / clear-filters control
- End-to-end: combined filter + search + sort + pagination working together

### Stories Covered
US-14, US-15, US-16, US-06 (full pagination + combined filtering)
