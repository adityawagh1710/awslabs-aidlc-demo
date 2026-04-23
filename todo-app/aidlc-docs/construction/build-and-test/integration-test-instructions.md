# Integration Test Instructions — TODO List App

## Overview

Integration tests verify that the layered components work together correctly end-to-end:
- HTTP request → Controller → Service → Repository → PostgreSQL/Redis → HTTP response
- Frontend RTK Query → MSW mock → Redux state updates

---

## Backend Integration Tests

### Prerequisites

Live PostgreSQL and Redis are required. Start them:

```bash
cd todo-backend
docker compose up db redis -d
```

Set test environment variables (or use a `.env.test` file):

```bash
export NODE_ENV=test
export DATABASE_URL=postgresql://todo_app:changeme@localhost:5432/todo
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=test-secret-minimum-32-chars-long-here
export JWT_EXPIRES_IN=15m
export JWT_ISSUER=todo-api
export JWT_AUDIENCE=todo-client
export BCRYPT_ROUNDS=4   # lower rounds for test speed
export LOG_LEVEL=warn
```

### Run integration tests

```bash
cd todo-backend
npm test
```

Vitest runs unit + integration + property tests together. Integration tests are in `tests/integration/`.

### Key integration scenarios

#### Auth (`tests/integration/auth.test.ts`)

| Scenario | Expected |
|---|---|
| `POST /api/v1/auth/register` — valid input | 201 + `{ accessToken, refreshToken, user }` |
| `POST /api/v1/auth/register` — duplicate email | 409 Conflict |
| `POST /api/v1/auth/login` — valid credentials | 200 + token pair |
| `POST /api/v1/auth/login` — wrong password | 401 (generic message) |
| `POST /api/v1/auth/refresh` — valid refresh token | 200 + new token pair |
| `POST /api/v1/auth/logout` — authenticated | 204 |
| Blacklisted access token reuse | 401 |
| 5 failed logins → 6th attempt | 401 (locked) |

#### Tasks (`tests/integration/tasks.test.ts`)

| Scenario | Expected |
|---|---|
| `GET /api/v1/tasks` — authenticated | 200 + paginated list |
| `POST /api/v1/tasks` — valid body | 201 + task DTO |
| `GET /api/v1/tasks/:id` — own task | 200 + task DTO |
| `GET /api/v1/tasks/:id` — other user's task | 403 Forbidden |
| `PUT /api/v1/tasks/:id` — valid update | 200 + updated task |
| `DELETE /api/v1/tasks/:id` — own task | 204 |
| `PATCH /api/v1/tasks/:id/toggle` — own task | 200 + toggled status |
| `GET /api/v1/tasks?search=foo` | 200 + filtered results |
| `GET /api/v1/tasks?status=active&priority=High` | 200 + filtered results |
| `GET /api/v1/tasks?page=2&pageSize=25` | 200 + page 2 |

#### Categories (`tests/integration/categories.test.ts`)

| Scenario | Expected |
|---|---|
| `GET /api/v1/categories` — authenticated | 200 + array |
| `POST /api/v1/categories` — valid name | 201 + category DTO |
| `POST /api/v1/categories` — duplicate name | 409 Conflict |
| `PUT /api/v1/categories/:id` — own category | 200 + updated |
| `DELETE /api/v1/categories/:id` — own category | 204 |
| Access another user's category | 403 Forbidden |

---

## Frontend Integration Tests

Frontend integration tests use MSW to mock the API and test RTK Query + Redux interactions.

### Run

```bash
cd todo-frontend
npm test
```

Integration tests are in `tests/integration/`.

### Key scenarios (`tests/integration/baseQueryWithReauth.test.ts`)

| Scenario | Expected |
|---|---|
| Successful login | `refreshToken` stored in `localStorage` |
| 401 → refresh success → retry | Original request retried with new token |
| 401 → refresh fail | `clearCredentials` dispatched, `localStorage` cleared |
| Logout | Credentials cleared optimistically |

---

## Full Stack Integration (Manual)

To verify the full stack works end-to-end locally:

```bash
cd todo-backend
docker compose up -d
```

This starts PostgreSQL, Redis, the backend API (port 3000), and the frontend (port 5173).

Then open `http://localhost:5173` and verify:
1. Register a new account → redirected to dashboard
2. Create a task → appears in list
3. Filter by priority → list updates
4. Search by title → matching tasks shown
5. Log out → redirected to login
6. Log back in → session restored
