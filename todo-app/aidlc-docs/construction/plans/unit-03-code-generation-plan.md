# Code Generation Plan — UNIT-03: Frontend Auth UI

## Unit Context
- **Repository**: `todo-frontend/` (new — greenfield)
- **Type**: Feature — Frontend (React + Vite + TypeScript)
- **Stories implemented**: US-01, US-02, US-03, US-04 (all frontend AC)
- **Dependencies**: UNIT-02 (live auth API endpoints)
- **Code location**: `/home/adityawagh/awslabs-aidlc-demo/todo-frontend/`

## Files Created vs Modified

- **Created** (new repo): all `todo-frontend/` files
- **Modified** (extending UNIT-01): `docker-compose.yml` (add `frontend` service), `.github/workflows/ci.yml` (add frontend jobs)
- **No Prisma changes** — frontend has no database

## Step Sequence

---

### PART A — Project Scaffold

**Step 1** — Project configuration files
- [x] `todo-frontend/package.json` — dependencies: react 18, react-dom, react-router-dom 6, @reduxjs/toolkit, react-redux, @hookform/resolvers, react-hook-form, zod; devDependencies: vite, typescript, @types/react, @types/react-dom, tailwindcss, autoprefixer, postcss, @vitejs/plugin-react, vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, msw, jsdom, @vitest/coverage-v8, eslint, @typescript-eslint/*, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y, eslint-plugin-import, prettier
- [x] `todo-frontend/tsconfig.json` — strict mode, ESNext module, JSX react-jsx
- [x] `todo-frontend/tsconfig.build.json` — extends tsconfig, excludes tests/
- [x] `todo-frontend/vite.config.ts` — React plugin, server host/port/proxy/polling, build chunkSizeWarningLimit 200, `@` alias
- [x] `todo-frontend/tailwind.config.js` — content paths for Tailwind purge
- [x] `todo-frontend/postcss.config.js` — tailwindcss + autoprefixer
- [x] `todo-frontend/components.json` — shadcn/ui config (style: default, rsc: false, tsx: true)
- [x] `todo-frontend/eslint.config.js` — ESLint 9 flat config
- [x] `todo-frontend/.prettierrc` — same as backend
- [x] `todo-frontend/.nvmrc` — `22`
- [x] `todo-frontend/.gitignore`
- [x] `todo-frontend/.env` — `VITE_API_URL=/`
- [x] `todo-frontend/.env.production` — `VITE_API_URL=https://your-api-domain.com`
- [x] `todo-frontend/.env.example`
- [x] `todo-frontend/index.html` — Vite HTML entry point

**Step 2** — Docker & CI infrastructure files
- [x] `todo-frontend/Dockerfile` — 4-stage: base → development → builder → production (Nginx)
- [x] `todo-frontend/nginx.conf` — SPA routing (try_files index.html), gzip, 1-year cache for hashed assets
- [x] `todo-frontend/.dockerignore`
- [x] `docker-compose.yml` — add `frontend` service (port 5173, bind-mount src/ + public/, depends_on api)
- [x] `.github/workflows/ci.yml` — add `frontend-lint`, `frontend-test`, `frontend-docker` jobs
- [x] Story: infrastructure for all US-01–04

**Step 3** — shadcn/ui base layer
- [x] `todo-frontend/src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- [x] `todo-frontend/src/components/ui/button.tsx`
- [x] `todo-frontend/src/components/ui/input.tsx`
- [x] `todo-frontend/src/components/ui/label.tsx`
- [x] `todo-frontend/src/components/ui/form.tsx` — RHF-compatible form fields
- [x] `todo-frontend/src/components/ui/card.tsx`
- [x] `todo-frontend/src/components/ui/toast.tsx`
- [x] `todo-frontend/src/components/ui/toaster.tsx`
- [x] `todo-frontend/src/components/ui/use-toast.ts`

---

### PART B — Types & State

**Step 4** — API types
- [x] `todo-frontend/src/types/api.ts` — RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest, AuthResponse, RefreshResponse, UserDto
- [x] Story: US-01, US-02, US-03

**Step 5** — Redux slices
- [x] `todo-frontend/src/store/authSlice.ts` — AuthState, setCredentials, clearCredentials, setInitialised, setSessionExpiredMessage + selectors
- [x] `todo-frontend/src/store/uiSlice.ts` — UiState, Toast, setReturnTo, clearReturnTo, addToast, removeToast + selectors
- [x] `todo-frontend/src/store/index.ts` — configureStore, AppDispatch, RootState, AppStore exports
- [x] Story: US-01, US-02, US-03, US-04

**Step 6** — RTK Query API layer
- [x] `todo-frontend/src/store/api/apiSlice.ts` — fetchBaseQuery + `baseQueryWithReauth` (401 intercept → refresh → single retry → redirect on failure)
- [x] `todo-frontend/src/store/api/authApi.ts` — register, login, refresh, logout endpoints
- [x] Story: US-01, US-02, US-03, US-04, US-17

**Step 7** — Token refresh library
- [x] `todo-frontend/src/lib/tokenRefresh.ts` — `scheduleProactiveRefresh()`, `cancelScheduledRefresh()`, `silentRefresh()`, `decodeExp()`
- [x] Story: US-04 (session expiry handling)

---

### PART C — Components & Pages

**Step 8** — Shared components
- [x] `todo-frontend/src/components/shared/ErrorBoundary.tsx` — class component, catches render errors, fallback UI with reload button
- [x] `todo-frontend/src/components/shared/LoadingSpinner.tsx` — animated SVG, size prop, aria-label
- [x] `todo-frontend/src/components/shared/PersistAuth.tsx` — reads localStorage refresh token on mount, calls /refresh, dispatches setInitialised
- [x] `todo-frontend/src/components/shared/ProtectedRoute.tsx` — two-stage guard (isInitialised → accessToken → Outlet)
- [x] `todo-frontend/src/components/shared/Toaster.tsx` — shadcn/ui Toaster wired to Redux ui.toasts
- [x] Story: US-04 (PersistAuth, ProtectedRoute), US-02 (ProtectedRoute redirect)

**Step 9** — Layout & pages
- [x] `todo-frontend/src/components/layout/AppShell.tsx` — nav bar (user email + logout), Outlet; fire-and-forget logout with `data-testid`
- [x] `todo-frontend/src/pages/LoginPage.tsx` — session expiry banner, redirect if authenticated, render LoginForm; `data-testid`
- [x] `todo-frontend/src/pages/RegisterPage.tsx` — redirect if authenticated, render RegisterForm; `data-testid`
- [x] `todo-frontend/src/pages/DashboardPage.tsx` — placeholder "My Tasks" page
- [x] Story: US-02 (LoginPage), US-01 (RegisterPage), US-03 (AppShell logout), US-04 (expiry banner)

**Step 10** — Auth form components
- [x] `todo-frontend/src/components/auth/LoginForm.tsx` — RHF+Zod, email+password fields, submit → authApi.login, 401/429 toasts, field preservation, `data-testid` on all interactive elements
- [x] `todo-frontend/src/components/auth/RegisterForm.tsx` — RHF+Zod, email+password+confirmPassword, submit → authApi.register, 409/429 toasts, field preservation, `data-testid`
- [x] Story: US-01 (RegisterForm), US-02 (LoginForm)

**Step 11** — App entry
- [x] `todo-frontend/src/App.tsx` — Router + PersistAuth + Routes (/login, /register, / → ProtectedRoute → AppShell → DashboardPage) + Toaster
- [x] `todo-frontend/src/main.tsx` — ErrorBoundary + Provider + BrowserRouter + App
- [x] Story: US-01, US-02, US-03, US-04

---

### PART D — Tests

**Step 12** — Test infrastructure
- [x] `todo-frontend/vitest.config.ts` — jsdom environment, setupFiles, globals, coverage v8
- [x] `todo-frontend/tests/setup.ts` — MSW server setup, @testing-library/jest-dom import, beforeAll/afterEach/afterAll MSW lifecycle

**Step 13** — Unit tests: Redux slices
- [x] `todo-frontend/tests/unit/authSlice.test.ts` — setCredentials, clearCredentials, setInitialised, setSessionExpiredMessage, all selectors
- [x] `todo-frontend/tests/unit/uiSlice.test.ts` — setReturnTo, clearReturnTo, addToast (id generated), removeToast

**Step 14** — Component tests (with snapshots)
- [x] `todo-frontend/tests/component/LoginForm.test.tsx` — renders, Zod validation errors, submit success (MSW 200), submit 401 toast, submit 429 toast; snapshot
- [x] `todo-frontend/tests/component/RegisterForm.test.tsx` — renders, Zod validation (password mismatch, short password), submit 201, submit 409, submit 429; snapshot
- [x] `todo-frontend/tests/component/LoginPage.test.tsx` — renders form when unauthenticated; redirects when authenticated; shows expiry banner; snapshot
- [x] `todo-frontend/tests/component/RegisterPage.test.tsx` — renders form; redirects when authenticated; snapshot
- [x] `todo-frontend/tests/component/AppShell.test.tsx` — renders user email, logout clears Redux + localStorage; snapshot
- [x] `todo-frontend/tests/component/ProtectedRoute.test.tsx` — spinner when not initialised; redirects when no token; renders outlet when authenticated
- [x] `todo-frontend/tests/component/PersistAuth.test.tsx` — no localStorage token → setInitialised(true); valid token → refresh success → setCredentials; refresh failure → setInitialised(true)

**Step 15** — Integration tests: baseQueryWithReauth
- [x] `todo-frontend/tests/integration/baseQueryWithReauth.test.ts` — 200 returns data; 401 → refresh success → retry returns data; 401 → refresh fail → clearCredentials + navigate

**Step 16** — Property tests
- [x] `todo-frontend/tests/property/auth.property.test.ts` — PBT-05 email normalisation; PBT-CLIENT-01 Zod schema accepts valid inputs; PBT-CLIENT-02 clearCredentials always nulls token+user; PBT-CLIENT-03 localStorage cleared after logout

---

### PART E — Documentation

**Step 17** — Code generation summary
- [x] Create `aidlc-docs/construction/unit-03/code/summary.md`
