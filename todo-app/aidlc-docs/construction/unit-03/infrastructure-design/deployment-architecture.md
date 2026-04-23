# Deployment Architecture — UNIT-03: Frontend Auth UI

## Local Development Architecture

```
Developer Machine
│
├── docker-compose up
│       │
│       ├── [db]       postgres:17-alpine     :5432
│       ├── [redis]    redis:7-alpine         :6379
│       ├── [api]      todo-backend (dev)     :3000   ← Fastify + tsx watch
│       └── [frontend] todo-frontend (dev)    :5173   ← Vite HMR
│
└── Browser → http://localhost:5173
                    │
                    ├── Static assets (HTML/CSS/JS) ←── Vite dev server
                    └── /api/* requests ─────────────── Vite proxy → http://api:3000
                                                              │
                                                         Fastify backend
                                                         (UNIT-02 auth routes)
```

**HMR flow**: Edit file in `todo-frontend/src/` → bind-mount propagates to container → Vite detects change (usePolling) → pushes HMR update to browser WebSocket → React module hot-replaced without page reload.

---

## Production Architecture

```
CI/CD (GitHub Actions)
    │
    ├── npm ci + npm run build (Vite)     → /dist (static assets, hashed filenames)
    └── docker build --target production  → Nginx Alpine image → GHCR push

Production Deployment (illustrative — not part of UNIT-03 scope)
    │
    ├── [frontend] Nginx container         :80
    │       └── serves /dist → index.html (all routes, SPA)
    │       └── static asset cache: 1 year (immutable hashed files)
    │
    └── [api]      Fastify container       :3000 (or behind load balancer)
```

---

## Shared docker-compose.yml Changes

The workspace-root `docker-compose.yml` (created in UNIT-01) is extended with the `frontend` service. Final service list:

| Service | Image/Build | Ports | Depends On |
|---|---|---|---|
| `db` | `postgres:17-alpine` | 5432 | — |
| `redis` | `redis:7-alpine` | 6379 | — |
| `api` | `./todo-backend` (dev target) | 3000 | db, redis (healthy) |
| `frontend` | `./todo-frontend` (dev target) | 5173 | api (started) |

All services share the `todo-net` bridge network.

---

## File Structure — `todo-frontend/`

New repository layout (from unit-of-work.md):

```
todo-frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── store/
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   ├── uiSlice.ts
│   │   └── api/
│   │       ├── apiSlice.ts
│   │       └── authApi.ts
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── layout/
│   │   │   └── AppShell.tsx
│   │   └── shared/
│   │       ├── ProtectedRoute.tsx
│   │       ├── PersistAuth.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── Toaster.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── DashboardPage.tsx
│   ├── lib/
│   │   └── tokenRefresh.ts       ← proactive refresh timer registry
│   └── types/
│       └── api.ts
├── public/
│   └── favicon.svg
├── tests/
│   ├── unit/
│   │   ├── authSlice.test.ts
│   │   └── uiSlice.test.ts
│   ├── component/
│   │   ├── LoginForm.test.tsx
│   │   ├── RegisterForm.test.tsx
│   │   ├── AppShell.test.tsx
│   │   ├── LoginPage.test.tsx
│   │   ├── RegisterPage.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   └── PersistAuth.test.tsx
│   ├── integration/
│   │   └── baseQueryWithReauth.test.ts
│   ├── property/
│   │   └── auth.property.test.ts
│   └── setup.ts                  ← Vitest setup (MSW server, @testing-library/jest-dom)
├── .env
├── .env.production
├── .env.example
├── .dockerignore
├── .gitignore
├── .nvmrc                        ← "22"
├── .prettierrc                   ← same as todo-backend
├── Dockerfile
├── eslint.config.js
├── nginx.conf
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── vite.config.ts
```

---

## npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Vite dev server (HMR) |
| `build` | `vite build` | Production build to `/dist` |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint . --max-warnings 0` | ESLint check |
| `lint:fix` | `eslint . --fix` | ESLint auto-fix |
| `type-check` | `tsc --noEmit` | TypeScript check (no output) |
| `format` | `prettier --write .` | Prettier format |
| `format:check` | `prettier --check .` | Prettier check |
| `test` | `vitest run` | Run all tests once |
| `test:watch` | `vitest` | Watch mode |
| `test:coverage` | `vitest run --coverage` | Coverage report |
