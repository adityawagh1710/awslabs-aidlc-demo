# Unit Test Execution — TODO List App

## Backend Unit Tests (`todo-backend`)

### Run all tests

```bash
cd todo-backend
npm test
```

### Run with coverage

```bash
cd todo-backend
npm run test:coverage
```

Coverage target: **≥ 80% line/branch** on business logic (`src/services/`, `src/repositories/`).

### Run a specific test file

```bash
cd todo-backend
npx vitest run tests/unit/auth.service.test.ts
```

### Test categories

| Category | Location | What it covers |
|---|---|---|
| Unit | `tests/unit/` | Services, repositories in isolation (mocked dependencies) |
| Integration | `tests/integration/` | Full HTTP request → DB → response (live PostgreSQL + Redis) |
| Property | `tests/property/` | fast-check PBT invariants |

### Integration test prerequisites

Integration tests require live PostgreSQL and Redis. Start them first:

```bash
cd todo-backend
docker compose up db redis -d
npx prisma migrate deploy
```

Then run:

```bash
npm test
```

### Expected results

| Suite | Tests | Notes |
|---|---|---|
| `token.service.test.ts` | ~8 | JWT sign/verify + PBT-02 round-trip |
| `brute-force.service.test.ts` | ~6 | Lockout threshold + PBT-04 |
| `auth.service.test.ts` | ~8 | Register/login/logout + PBT-01 |
| `task.service.test.ts` | ~12 | CRUD + IDOR + overdue + PBT |
| `category.service.test.ts` | ~8 | CRUD + IDOR + PBT |
| `auth.test.ts` (integration) | ~10 | Full HTTP auth flows |
| `tasks.test.ts` (integration) | ~14 | Full HTTP task CRUD |
| `categories.test.ts` (integration) | ~8 | Full HTTP category CRUD |
| `auth.property.test.ts` | ~4 | PBT-01, PBT-02, PBT-04, PBT-05 |
| `tasks.property.test.ts` | ~4 | PBT-TASK-01 through PBT-TASK-04 |
| `filter.property.test.ts` | ~5 | PBT-FILTER-02 through PBT-FILTER-06 |

---

## Frontend Unit Tests (`todo-frontend`)

### Run all tests

```bash
cd todo-frontend
npm test
```

### Run with coverage

```bash
cd todo-frontend
npm run test:coverage
```

Coverage target: **≥ 80% line/branch** (excludes `src/components/ui/` and `src/main.tsx`).

### Test categories

| Category | Location | What it covers |
|---|---|---|
| Unit | `tests/unit/` | Redux slices and selectors |
| Component | `tests/component/` | React components with MSW + RTL |
| Integration | `tests/integration/` | RTK Query reauth flow |
| Property | `tests/property/` | fast-check PBT invariants |

### Expected results

| Suite | Tests | Notes |
|---|---|---|
| `authSlice.test.ts` | ~8 | All reducers + selectors |
| `uiSlice.test.ts` | ~7 | All reducers + selectors |
| `LoginForm.test.tsx` | ~5 | Render, validation, 200/401/429 |
| `RegisterForm.test.tsx` | ~6 | Render, validation, 201/409/429 |
| `LoginPage.test.tsx` | ~3 | Render, expiry banner |
| `RegisterPage.test.tsx` | ~2 | Render, redirect |
| `AppShell.test.tsx` | ~2 | Email display, logout |
| `ProtectedRoute.test.tsx` | ~3 | Spinner, redirect, outlet |
| `SearchInput.test.tsx` | ~5 | Submit, Enter, empty, sync |
| `FilterBar.test.tsx` | ~7 | Status, priority, category, dates |
| `ActiveFiltersBar.test.tsx` | ~4 | Hidden, chips, remove, clear all |
| `DashboardPage.test.tsx` | ~8 | Heading, buttons, filter components |
| `TaskRow.test.tsx` | ~4 | Render, toggle, delete |
| `TaskForm.test.tsx` | ~5 | Validation, submit |
| `CategoryPicker.test.tsx` | ~3 | Render, select |
| `baseQueryWithReauth.test.ts` | ~3 | Login, refresh fail, logout |
| `auth.property.test.ts` | ~4 | PBT-05, PBT-CLIENT-01–03 |
| `tasks-frontend.property.test.ts` | ~3 | Frontend task invariants |
| `url-filters.property.test.ts` | ~4 | PBT-UI-01–04 |
