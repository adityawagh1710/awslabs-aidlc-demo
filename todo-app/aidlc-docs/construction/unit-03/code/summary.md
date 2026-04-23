# Code Generation Summary — UNIT-03: Frontend Auth UI

## Status
All 17 steps completed. UNIT-03 code generation is complete.

## Files Created (new `todo-frontend/` repository)

### Project Config (Step 1 — pre-existing from scaffold)
- `package.json`, `tsconfig.json`, `tsconfig.build.json`, `vite.config.ts`
- `tailwind.config.js`, `postcss.config.js`, `components.json`, `eslint.config.js`
- `.prettierrc`, `.nvmrc`, `.gitignore`, `.env`, `.env.production`, `.env.example`
- `index.html`

### Docker & CI (Step 2 — pre-existing from scaffold)
- `Dockerfile`, `nginx.conf`, `.dockerignore`
- `docker-compose.yml` — `frontend` service added (in `todo-backend/`)
- `.github/workflows/ci.yml` — `frontend-lint`, `frontend-test`, `frontend-docker` jobs added

### shadcn/ui Base Layer (Step 3)
- `src/lib/utils.ts` — `cn()` utility
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/form.tsx` — RHF-compatible form fields
- `src/components/ui/card.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/use-toast.ts`

### Types & State (Steps 4–7)
- `src/types/api.ts` — RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest, AuthResponse, RefreshResponse, UserDto, ApiError
- `src/store/authSlice.ts` — AuthState, setCredentials, clearCredentials, setInitialised, setSessionExpiredMessage + selectors
- `src/store/uiSlice.ts` — UiState, Toast, setReturnTo, clearReturnTo, addToast, removeToast + selectors
- `src/store/index.ts` — configureStore, AppDispatch, RootState, AppStore
- `src/store/hooks.ts` — useAppDispatch, useAppSelector typed hooks
- `src/store/api/apiSlice.ts` — fetchBaseQuery + baseQueryWithReauth (401 intercept → refresh → retry)
- `src/store/api/authApi.ts` — register, login, refresh, logout RTK Query endpoints
- `src/lib/tokenRefresh.ts` — scheduleProactiveRefresh, cancelScheduledRefresh, silentRefresh, decodeExp

### Components & Pages (Steps 8–11)
- `src/components/shared/ErrorBoundary.tsx` — class component, reload button
- `src/components/shared/LoadingSpinner.tsx` — animated SVG, size prop, aria-label
- `src/components/shared/PersistAuth.tsx` — restores session from localStorage on mount
- `src/components/shared/ProtectedRoute.tsx` — two-stage guard (initialised → authenticated)
- `src/components/shared/Toaster.tsx` — bridges Redux ui.toasts → shadcn/ui toast
- `src/components/layout/AppShell.tsx` — nav bar with user email + logout button
- `src/pages/LoginPage.tsx` — session expiry banner, redirect if authenticated
- `src/pages/RegisterPage.tsx` — redirect if authenticated
- `src/pages/DashboardPage.tsx` — placeholder "My Tasks" page
- `src/components/auth/LoginForm.tsx` — RHF+Zod, 401/429 toasts, data-testid on all elements
- `src/components/auth/RegisterForm.tsx` — RHF+Zod, password confirm, 409/429 toasts, data-testid
- `src/App.tsx` — Router + PersistAuth + Routes + Toaster
- `src/main.tsx` — ErrorBoundary + Provider + BrowserRouter + App

### Tests (Steps 12–16)
- `vitest.config.ts` — jsdom, setupFiles, coverage v8 ≥80%
- `tests/setup.ts` — MSW server, default handlers, beforeAll/afterEach/afterAll lifecycle
- `tests/utils/renderWithProviders.tsx` — test utility with store + MemoryRouter
- `tests/unit/authSlice.test.ts` — all reducers + selectors
- `tests/unit/uiSlice.test.ts` — all reducers + selectors
- `tests/component/LoginForm.test.tsx` — render, Zod validation, 200/401/429
- `tests/component/RegisterForm.test.tsx` — render, Zod validation, 201/409/429
- `tests/component/LoginPage.test.tsx` — render, session expiry banner
- `tests/component/RegisterPage.test.tsx` — render, redirect when authenticated
- `tests/component/AppShell.test.tsx` — user email, logout clears localStorage
- `tests/component/ProtectedRoute.test.tsx` — spinner, redirect, outlet
- `tests/integration/baseQueryWithReauth.test.ts` — login success, refresh fail, logout
- `tests/property/auth.property.test.ts` — PBT-05, PBT-CLIENT-01, PBT-CLIENT-02, PBT-CLIENT-03

## Key Design Decisions

### PersistAuth + ProtectedRoute split
`PersistAuth` handles the async session restore (runs once on mount). `ProtectedRoute` is a pure synchronous guard — it only checks Redux state. This avoids race conditions and keeps each component single-responsibility.

### Optimistic logout
The logout mutation clears Redux + localStorage immediately before the server responds. This ensures the UI feels instant even if the network is slow. The server-side blacklist is a best-effort operation.

### baseQueryWithReauth mutex
A module-level `isRefreshing` flag prevents multiple simultaneous refresh calls when several requests 401 at the same time. All waiters share the same `refreshPromise`.

### data-testid on all interactive elements
Every button, input, form, and page wrapper has a `data-testid` following the `{component}-{element-role}` convention for stable automation targeting.

## Security Controls Implemented

| Control | Implementation |
|---|---|
| IDOR prevention | userId never taken from user input; always from server JWT |
| Token storage | Access token in Redux memory only; refresh token in localStorage |
| Session expiry | 401 → refresh attempt → clear + redirect on failure |
| Brute-force feedback | 429 responses shown as rate-limit toast (no lockout details exposed) |
| Redirect after login | returnTo stored in Redux, cleared after use |

## PBT Coverage

| PBT ID | Test File | Invariant |
|---|---|---|
| PBT-05 | `auth.property.test.ts` | Email normalisation idempotency |
| PBT-CLIENT-01 | `auth.property.test.ts` | Zod login schema accepts valid email + non-empty password |
| PBT-CLIENT-02 | `auth.property.test.ts` | clearCredentials always nulls token + user |
| PBT-CLIENT-03 | `auth.property.test.ts` | localStorage cleared after logout for any refresh token value |
