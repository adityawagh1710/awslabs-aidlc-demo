# ✅ TodoApp

A production-grade, full-stack task management application built with **Fastify**, **React**, **PostgreSQL**, and **Redis**. Multi-user, fully authenticated, with search, filtering, categories, pagination, and E2E Cypress tests.

---

## Features

| Feature | Details |
|---|---|
| **Authentication** | Register, login, logout with JWT access tokens + refresh token rotation |
| **Session behaviour** | Session persists across page refreshes; cleared on window/tab close |
| **Brute-force protection** | 5 failed logins → 15-min lockout per email |
| **Task management** | Create, view, edit, delete tasks with title, description, priority, due date |
| **Completion toggle** | Mark tasks complete/incomplete with optimistic UI updates |
| **Overdue indicators** | Tasks past their due date highlighted in red |
| **Categories** | Create, rename, delete your own categories; assign multiple to tasks |
| **Search with suggestions** | Full-text search with live title suggestions as you type |
| **Filtering** | Filter by status, priority, category, due date range — combinable |
| **Sorting** | Sort by due date, priority, creation date, or title |
| **Pagination** | 25 tasks per page; URL-based state (shareable/bookmarkable) |
| **Private data** | Each user's tasks and categories are fully isolated (IDOR enforced) |

---

## Tech Stack

### Backend (`todo-backend/`)

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 LTS |
| Language | TypeScript 5.7 (strict mode) |
| Framework | Fastify 5 |
| Database | PostgreSQL 17 via Prisma 6 ORM |
| Cache / Sessions | Redis 7 (token blacklist, brute-force counters, refresh tokens) |
| Auth | `@fastify/jwt` — access tokens (15 min) + refresh tokens (7 days) |
| Password hashing | bcryptjs (12 rounds) |
| Input validation | Zod + Fastify JSON Schema (AJV) |
| Logging | pino (structured JSON) |
| Testing | Vitest 2 + fast-check (property-based testing) — 128 tests |
| Linting | ESLint 9 + Prettier |

### Frontend (`todo-frontend/`)

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 6 |
| Language | TypeScript 5.7 (strict mode) |
| State management | Redux Toolkit + RTK Query |
| Routing | React Router v6 (URL-based filter/sort state) |
| Forms | React Hook Form + Zod |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS 3 (violet/indigo theme) |
| Unit/Component tests | Vitest 2 + Testing Library + MSW + fast-check — 98 tests |
| E2E tests | Cypress 15 — 24 tests across auth, tasks, categories, filters |

---

## Architecture

```
┌─────────────────────┐        HTTPS         ┌──────────────────────┐
│   todo-frontend     │ ──────────────────>  │    todo-backend      │
│                     │  /api/v1/*            │                      │
│  React 18 SPA       │  Bearer token         │  Fastify 5 + TS      │
│  Redux Toolkit      │ <──────────────────   │  Controller →        │
│  RTK Query          │  JSON responses       │  Service →           │
└─────────────────────┘                       │  Repository          │
                                              └──────────┬───────────┘
                                                         │
                                              ┌──────────┴───────────┐
                                              │  PostgreSQL 17        │
                                              │  Redis 7              │
                                              └──────────────────────┘
```

### Backend layers

- **Routes** — Fastify route registration + JSON Schema validation
- **Controllers** — HTTP request/response handling
- **Services** — Business logic, IDOR enforcement, domain rules
- **Repositories** — Prisma ORM data access

### Database schema

| Table | Purpose |
|---|---|
| `User` | Accounts (email, bcrypt password hash) |
| `Task` | Tasks (title, description, priority, dueDate, status, completedAt) |
| `Category` | User-owned categories (name, colour) |
| `TaskCategory` | Many-to-many join between tasks and categories |

---

## Quick Start (Docker)

### Development — zero config required

```bash
git clone <repo-url>
cd awslabs-aidlc-demo/todo-app/todo-backend
docker compose up -d --build
```

Open:
- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:3000
- **Health check** → http://localhost:3000/health

> First run builds images (~2–3 min). Subsequent starts take ~10 seconds.
> `docker compose` automatically merges `docker-compose.yml` + `docker-compose.override.yml` — safe dev defaults are applied, no `.env` file needed.

### Production

Create a `.env` file with real secrets:

```env
POSTGRES_PASSWORD=<strong-random-password>
JWT_SECRET=<random-string-minimum-32-characters>
CORS_ORIGIN=https://your-domain.com
```

Then run:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Production differences vs dev:
- API built from compiled JS (`production` target) — no dev tools, runs as non-root user
- Frontend served by Nginx on port 80 (not Vite dev server)
- DB port NOT exposed to host
- Missing required env vars cause an immediate startup error (fail-fast)
- No source bind mounts — image is fully self-contained

### Test (CI)

The CI pipeline (`backend-test` job) runs tests directly with GitHub Actions services — no compose file needed. See `.github/workflows/ci.yml`.

---

## Local Development (without Docker)

### Prerequisites

- Node.js >= 22 (`nvm use` in each repo)
- Docker (for PostgreSQL + Redis only)
- npm >= 10

### Setup

```bash
# Start only the databases
cd todo-backend && docker compose up db redis -d

# Backend
cd todo-backend
cp .env.example .env        # fill in JWT_SECRET
npm install
npx prisma migrate deploy
npm run dev                 # http://localhost:3000

# Frontend (new terminal)
cd todo-frontend
npm install
npm run dev                 # http://localhost:5173
```

### Environment variables (`todo-backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `JWT_SECRET` | ✅ | — | Min 32-char random string |
| `JWT_EXPIRES_IN` | | `15m` | Access token lifetime |
| `JWT_ISSUER` | | `todo-api` | JWT issuer claim |
| `JWT_AUDIENCE` | | `todo-client` | JWT audience claim |
| `PORT` | | `3000` | Server port |
| `CORS_ORIGIN` | | `*` | Allowed CORS origin |
| `LOG_LEVEL` | | `info` | pino log level |
| `BCRYPT_ROUNDS` | | `12` | bcrypt cost factor |

---

## Running Tests

### Backend — 128 tests

```bash
cd todo-backend
docker compose up db redis -d   # live DB + Redis required
npm test
npm run test:coverage            # target: ≥80%
```

### Frontend — 98 unit/component tests

```bash
cd todo-frontend
npm test                         # MSW mocks API — no Docker needed
npm run test:coverage
```

### E2E — 24 Cypress tests

Requires the full stack running (`docker compose up -d`):

```bash
cd todo-frontend
npm run cy:run                   # headless
npm run cy:open                  # interactive UI
```

Cypress specs:

| Spec | Tests | Coverage |
|---|---|---|
| `auth.cy.ts` | 7 | Register, login, logout, validation, redirects |
| `categories.cy.ts` | 4 | Create, duplicate rejection, delete |
| `filters.cy.ts` | 6 | Filter bar, search, sort, clear |
| `tasks.cy.ts` | 7 | CRUD, toggle completion, validation |

### Test summary

| Suite | Tests | Type |
|---|---|---|
| Backend unit | ~60 | Services, repositories |
| Backend integration | ~28 | Full HTTP flows (live DB + Redis) |
| Backend PBT | ~18 | JWT, filter, brute-force invariants |
| Frontend unit | ~24 | Redux slices |
| Frontend component | ~50 | Pages + forms (RTL + MSW) |
| Frontend PBT | ~12 | URL state, Zod schema, auth invariants |
| E2E (Cypress) | 24 | Full user flows against running app |

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register new account |
| `POST` | `/auth/login` | — | Login, returns token pair |
| `POST` | `/auth/refresh` | — | Rotate refresh token |
| `POST` | `/auth/logout` | ✅ | Blacklist access token |
| `POST` | `/auth/logout-beacon` | — | Window-close logout (sendBeacon) |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks` | ✅ | List tasks (search, filter, sort, paginate) |
| `POST` | `/tasks` | ✅ | Create task |
| `GET` | `/tasks/:id` | ✅ | Get task detail |
| `PUT` | `/tasks/:id` | ✅ | Update task |
| `DELETE` | `/tasks/:id` | ✅ | Delete task |
| `PATCH` | `/tasks/:id/toggle` | ✅ | Toggle completion |

#### Query parameters for `GET /tasks`

| Param | Type | Example |
|---|---|---|
| `search` | string | `?search=groceries` |
| `status` | `active` \| `completed` \| `all` | `?status=active` |
| `priority` | `Low` \| `Medium` \| `High` (multi) | `?priority=High&priority=Medium` |
| `categoryIds` | string[] | `?categoryIds=abc&categoryIds=def` |
| `dueDateFrom` | `YYYY-MM-DD` | `?dueDateFrom=2026-05-01` |
| `dueDateTo` | `YYYY-MM-DD` | `?dueDateTo=2026-05-31` |
| `sortBy` | `dueDate` \| `priority` \| `createdAt` \| `title` | `?sortBy=dueDate` |
| `sortOrder` | `asc` \| `desc` | `?sortOrder=asc` |
| `page` | number | `?page=2` |
| `pageSize` | number (max 50) | `?pageSize=25` |

### Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | ✅ | List user's categories |
| `POST` | `/categories` | ✅ | Create category |
| `PUT` | `/categories/:id` | ✅ | Rename category |
| `DELETE` | `/categories/:id` | ✅ | Delete category |

---

## Security

All 15 security baseline controls implemented:

| Control | Implementation |
|---|---|
| Password hashing | bcryptjs, 12 rounds |
| JWT validation | Verified on every protected request |
| Token blacklisting | Redis-backed, auto-expiring |
| Security headers | `@fastify/helmet` |
| Input validation | Zod + AJV on all endpoints |
| IDOR prevention | `userId` always from JWT, never from request body |
| Rate limiting | 10 req/15 min on auth endpoints (production) |
| Brute-force protection | 5 failures → 15-min lockout per email |
| Constant-time login | DUMMY_HASH prevents timing oracle |
| Refresh token rotation | Old token revoked on every use |
| No credential exposure | `passwordHash` never in any response |
| Fail-closed Redis | 503 when Redis unavailable during auth |
| Secrets via env vars | No hardcoded credentials anywhere |
| CORS configured | Wildcard in dev, explicit origin in production |
| Audit logging | 7 auth event types logged with IP + user agent |

---

## Session Behaviour

- Tokens stored in `sessionStorage` (not `localStorage`)
- **Page refresh** → session restored automatically via silent token refresh
- **Window/tab close** → `sessionStorage` cleared by browser → login required on next open
- **Explicit logout** → tokens blacklisted server-side + cleared client-side

---

## Connecting to the Database

**DBeaver / TablePlus / pgAdmin:**

```
Host:     localhost
Port:     5433
Database: todo
User:     todo_app
Password: changeme
```

**Prisma Studio (visual browser UI):**

```bash
cd todo-backend && npx prisma studio
# Opens at http://localhost:5555
```

**psql:**

```bash
docker exec -it todo-backend-db-1 psql -U todo_app -d todo
```

---

## Project Structure

```
awslabs-aidlc-demo/
├── README.md
├── todo-backend/
│   ├── src/
│   │   ├── config/          # Env validation
│   │   ├── controllers/     # HTTP handlers
│   │   ├── domain/          # Error classes
│   │   ├── plugins/         # Fastify plugins (auth, security, redis)
│   │   ├── repositories/    # Prisma data access
│   │   ├── routes/          # Route registration + schemas
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript augmentations
│   │   └── utils/           # Sanitize, date helpers
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── property/
│   │   └── helpers/
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
├── todo-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # LoginForm, RegisterForm
│   │   │   ├── categories/  # CategoryManager
│   │   │   ├── layout/      # AppShell (nav + logout)
│   │   │   ├── shared/      # ProtectedRoute, PersistAuth, ErrorBoundary
│   │   │   ├── tasks/       # TaskList, TaskRow, TaskForm, FilterBar, SearchInput, ActiveFiltersBar
│   │   │   └── ui/          # shadcn/ui primitives
│   │   ├── pages/           # LoginPage, RegisterPage, DashboardPage, TaskDetailPage, TaskFormPage, CategoryManagementPage
│   │   ├── store/
│   │   │   ├── api/         # RTK Query (authApi, tasksApi, categoriesApi, apiSlice)
│   │   │   ├── authSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── types/           # API DTOs
│   ├── tests/
│   │   ├── unit/
│   │   ├── component/
│   │   ├── integration/
│   │   └── property/
│   ├── cypress/
│   │   ├── e2e/             # auth, tasks, categories, filters specs
│   │   └── support/         # commands, e2e setup
│   ├── cypress.config.ts
│   ├── Dockerfile
│   └── package.json
│
└── aidlc-docs/              # AI-DLC design documentation
```

---

## Docker Compose Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `db` | `postgres:17-alpine` | `5433:5432` | PostgreSQL database |
| `redis` | `redis:7-alpine` | `6379:6379` | Token store + brute-force counters |
| `api` | Built from `todo-backend/` | `3000:3000` | Fastify REST API |
| `frontend` | Built from `todo-frontend/` | `5173:5173` | Vite dev server |

---

## License

UNLICENSED — private project.
