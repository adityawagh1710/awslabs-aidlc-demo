# Logical Components — UNIT-03: Frontend Auth UI

## Component Map

```
main.tsx
  └── <ErrorBoundary>          [Pattern 8 — Resilience]
        └── <Provider store>
              └── <BrowserRouter>
                    └── <App>
                          ├── <Toaster />              [UX — global toast queue]
                          └── <PersistAuth>            [Pattern 5 — Startup Auth]
                                └── <Routes>
                                      ├── /login    → <LoginPage>
                                      │               └── <LoginForm>
                                      ├── /register → <RegisterPage>
                                      │               └── <RegisterForm>
                                      └── /*        → <ProtectedRoute>  [Pattern 6 — Route Guard]
                                                        └── <AppShell>
                                                              └── <DashboardPage> (placeholder)
```

---

## Redux Store

```
store/
  ├── index.ts          — configureStore({ auth, ui, [authApi.reducerPath] })
  ├── authSlice.ts      — setCredentials, clearCredentials, setInitialised, setSessionExpiredMessage
  ├── uiSlice.ts        — setReturnTo, clearReturnTo, addToast, removeToast
  └── api/
      ├── apiSlice.ts   — baseQueryWithReauth  [Pattern 3]
      └── authApi.ts    — register, login, refresh, logout endpoints
```

---

## Component Definitions

### `ErrorBoundary` — Pattern 8
| Attribute | Detail |
|---|---|
| **Responsibility** | Catch unhandled render errors; render static fallback UI |
| **Pattern applied** | Pattern 8 (ErrorBoundary Isolation) |
| **Never shows** | Stack traces or internal error details to user |

---

### `PersistAuth` — Pattern 5
| Attribute | Detail |
|---|---|
| **Responsibility** | Read `localStorage:todo_refresh_token` on mount; call `POST /refresh` if present; dispatch `setInitialised(true)` when done |
| **Pattern applied** | Pattern 5 (Startup Auth Persistence) |
| **Blocks rendering** | Yes — renders `<LoadingSpinner>` until `isInitialised = true` |
| **On refresh failure** | Removes localStorage token; dispatches `setInitialised(true)`; routes render unauthenticated |

---

### `ProtectedRoute` — Pattern 6
| Attribute | Detail |
|---|---|
| **Responsibility** | Gate authenticated routes; handle initialisation wait and unauthenticated redirect |
| **Pattern applied** | Pattern 6 (Route Guard Sequence) |
| **Stage 1** | `!isInitialised` → `<LoadingSpinner />` |
| **Stage 2** | `!accessToken` → dispatch `setReturnTo(location.pathname+search)`, `<Navigate to="/login" replace />` |
| **Stage 3** | `accessToken` → `<Outlet />` |

---

### `baseQueryWithReauth` — Pattern 3
| Attribute | Detail |
|---|---|
| **Responsibility** | Intercept 401; attempt one token refresh; retry original request; redirect on persistent 401 |
| **Pattern applied** | Pattern 3 (Single-Retry baseQuery) |
| **Retry guard** | Checks `isRefreshRequest(args)` to prevent recursive refresh |
| **On success** | `setCredentials`, store new refresh token, `scheduleProactiveRefresh`, retry |
| **On failure** | `clearCredentials`, remove localStorage token, `cancelScheduledRefresh`, `setReturnTo`, `setSessionExpiredMessage`, navigate `/login` |

---

### `AppShell` — Pattern 4
| Attribute | Detail |
|---|---|
| **Responsibility** | Persistent nav bar (user email + Logout); render `<Outlet>` for page content |
| **Pattern applied** | Pattern 4 (Fire-and-Forget Logout) |
| **Logout sequence** | `dispatch(clearCredentials())` → `removeItem('todo_refresh_token')` → `cancelScheduledRefresh()` → `navigate('/login')` → POST /logout (async, ignored) |

---

### `LoginForm` — Pattern 10
| Attribute | Detail |
|---|---|
| **Responsibility** | Collect and validate login credentials; call `authApi.login`; handle token storage + proactive refresh scheduling |
| **Pattern applied** | Pattern 10 (Uncontrolled Form Inputs) |
| **Validation** | Zod schema via `zodResolver`; blur + submit |
| **On 200** | `setCredentials`, store refresh token, `scheduleProactiveRefresh`, clear `sessionExpiredMessage`, `navigate(returnTo \|\| '/')`, `clearReturnTo()` |
| **On 401** | Toast "Invalid email or password"; clear password field |
| **On 429** | Toast "Too many attempts. Please try again later." |

---

### `RegisterForm` — Pattern 10
| Attribute | Detail |
|---|---|
| **Responsibility** | Collect and validate registration data; call `authApi.register`; handle token storage + proactive refresh |
| **Pattern applied** | Pattern 10 (Uncontrolled Form Inputs) |
| **Validation** | Zod schema with `confirmPassword` refine; blur + submit |
| **On 201** | `setCredentials`, store refresh token, `scheduleProactiveRefresh`, `navigate('/')` |
| **On 409** | Toast "An account with this email already exists"; retain email, clear passwords |

---

### Proactive Refresh Timer Registry — Pattern 2
| Attribute | Detail |
|---|---|
| **Responsibility** | Schedule and cancel proactive token refresh |
| **Pattern applied** | Pattern 2 (Sliding Proactive Refresh) |
| **Storage** | Module-level `refreshTimerId` — NOT in Redux (timers are not serializable) |
| **Schedule** | `setTimeout(silentRefresh, (exp - now - 120) * 1000)` |
| **Cancel** | `clearTimeout(refreshTimerId)` — called before rescheduling and on logout |
| **Location** | `src/lib/tokenRefresh.ts` — imported by `baseQueryWithReauth` and `AppShell` logout handler |

---

## Data Flow — Login

```
LoginForm submit
    │
    ▼
authApi.login (RTK Query mutation)
    │── prepareHeaders: attach accessToken (null on login, so no Authorization header)
    │
    ▼
baseQueryWithReauth
    │── 200 → return data
    │── 401 → attempt refresh (no refresh token on login → redirect)
    │
    ▼
LoginForm onSuccess handler
    ├── dispatch(setCredentials({ accessToken, user }))
    ├── localStorage.setItem('todo_refresh_token', refreshToken)
    ├── scheduleProactiveRefresh(decodeExp(accessToken))        [Pattern 2]
    ├── dispatch(setSessionExpiredMessage(null))
    ├── navigate(returnTo || '/')
    └── dispatch(clearReturnTo())
```

---

## Data Flow — Authenticated Request (any protected page)

```
RTK Query hook (e.g. tasksApi.getTask — future unit)
    │
    ▼
baseQueryWithReauth
    │── prepareHeaders: Authorization: Bearer <accessToken>
    │── 200 → return data (happy path)
    │── 401 (unexpected — proactive refresh missed)
    │       ├── read 'todo_refresh_token' from localStorage
    │       ├── POST /auth/refresh
    │       │     ├── 200 → setCredentials, store new token, scheduleProactiveRefresh
    │       │     │         retry original request once
    │       │     └── error → clearCredentials, removeItem, setReturnTo
    │       │                 setSessionExpiredMessage, navigate('/login')
    │       └── (done)
```

---

## Dependency Wiring

No DI container. All wiring via React context (Redux Provider) and RTK Query injection:

```typescript
// store/index.ts
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware),
})

// src/lib/tokenRefresh.ts — module singleton
let refreshTimerId: ReturnType<typeof setTimeout> | null = null
export function scheduleProactiveRefresh(exp: number, dispatch: AppDispatch): void { ... }
export function cancelScheduledRefresh(): void { ... }
export async function silentRefresh(dispatch: AppDispatch): Promise<void> { ... }
```
