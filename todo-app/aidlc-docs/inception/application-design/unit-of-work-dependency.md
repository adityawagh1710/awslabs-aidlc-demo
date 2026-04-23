# Unit of Work Dependencies — TODO List App

---

## Dependency Matrix

| Unit | Depends On | Dependency Type |
|---|---|---|
| UNIT-01: DB & Infrastructure | — | Root unit |
| UNIT-02: Backend Auth | UNIT-01 | Hard — needs DB schema + Fastify scaffold |
| UNIT-03: Frontend Auth UI | UNIT-02 | Hard — needs live auth API endpoints |
| UNIT-04: Backend Task CRUD & Categories | UNIT-02 | Hard — needs AuthPlugin, UserRepository, domain errors |
| UNIT-05: Frontend Task CRUD & Categories UI | UNIT-03 + UNIT-04 | Hard — needs auth state + task/category API |
| UNIT-06: Backend Search, Filter & Pagination | UNIT-04 | Hard — extends TaskRepository and TaskService |
| UNIT-07: Frontend Search, Filter & Pagination UI | UNIT-05 + UNIT-06 | Hard — extends uiSlice and task list API |

---

## Development Sequence (Interleaved)

```
Step 1   UNIT-01   DB & Infrastructure Foundation
           |
Step 2   UNIT-02   Backend: Auth & User Management
           |
Step 3   UNIT-03   Frontend: Auth UI
           |
Step 4   UNIT-04   Backend: Task CRUD & Categories
           |
Step 5   UNIT-05   Frontend: Task CRUD & Categories UI
           |
Step 6   UNIT-06   Backend: Search, Filter & Pagination
           |
Step 7   UNIT-07   Frontend: Search, Filter & Pagination UI
           |
       BUILD & TEST (all units)
```

---

## Shared Resources & Integration Points

| Resource | Owned By | Consumed By |
|---|---|---|
| PostgreSQL database | UNIT-01 (schema) | UNIT-02, UNIT-04, UNIT-06 |
| Prisma client | UNIT-01 (generated) | All backend repositories |
| `AuthPlugin` (JWT preHandler) | UNIT-02 | UNIT-04, UNIT-06 |
| `domain/errors.ts` | UNIT-01 | UNIT-02, UNIT-04, UNIT-06 |
| `authSlice` + `apiSlice` | UNIT-03 | UNIT-05, UNIT-07 |
| `uiSlice` (partial) | UNIT-05 | UNIT-07 (extends filter state) |
| `AppShell` + `ProtectedRoute` | UNIT-03 | UNIT-05, UNIT-07 |
| `Toast`, `LoadingSpinner`, `EmptyState` | UNIT-03 | UNIT-05, UNIT-07 |
| API contract (TypeScript DTOs) | `todo-frontend/src/types/api.ts` | All frontend units |

---

## API Contract Agreement (UNIT-03 Milestone)

Because development is interleaved, the following API shapes must be agreed before UNIT-03 starts and MUST NOT change without coordinating both repos:

```typescript
// Auth endpoints
POST /api/v1/auth/register  → { token: string, user: { id: string, email: string } }
POST /api/v1/auth/login     → { token: string, user: { id: string, email: string } }
POST /api/v1/auth/logout    → 204 No Content

// Error shape (all endpoints)
{ error: string, message: string }
{ error: "ValidationError", fields: Record<string, string> }
```

Task and Category API shapes are agreed before UNIT-05 starts (end of UNIT-04).

---

## Rollback Strategy

| Risk | Mitigation |
|---|---|
| UNIT-02 auth API unstable when UNIT-03 starts | UNIT-03 uses env variable for API base URL; can point to a mock server |
| Schema change needed after UNIT-04 | Prisma migration + re-run `prisma migrate dev`; no data loss in development |
| Filter behaviour mismatch between UNIT-06 and UNIT-07 | Agree query param names and response shape before UNIT-06 starts |
