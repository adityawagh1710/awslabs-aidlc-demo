# Frontend Components — UNIT-03: Frontend Auth UI

## Component Hierarchy

```
main.tsx
  └── <ErrorBoundary>
        └── <Provider store={store}>
              └── <BrowserRouter>
                    └── <App>
                          └── <PersistAuth>        ← startup refresh check
                                └── <Routes>
                                      ├── /login    → <LoginPage>
                                      ├── /register → <RegisterPage>
                                      └── /         → <ProtectedRoute>
                                                          └── <AppShell>
                                                                └── <DashboardPage> (placeholder)
```

---

## Component Definitions

---

### `ErrorBoundary`

| Attribute | Detail |
|---|---|
| **File** | `src/components/shared/ErrorBoundary.tsx` |
| **Type** | Class component (required for error boundary) |
| **Props** | `{ children: ReactNode }` |
| **State** | `{ hasError: boolean; error: Error \| null }` |
| **Catches** | Any unhandled render error in the subtree |
| **Renders** | Fallback UI: "Something went wrong" + reload button |
| **Does not catch** | Async errors (event handlers, setTimeout) — those use toast |

---

### `PersistAuth`

| Attribute | Detail |
|---|---|
| **File** | `src/components/shared/PersistAuth.tsx` |
| **Props** | `{ children: ReactNode }` |
| **Behaviour** | On mount: reads `localStorage.getItem('todo_refresh_token')`, calls `authApi.refresh()` if found; dispatches `setInitialised(true)` when done (success or fail) |
| **Renders** | `<LoadingSpinner />` while `isInitialised === false`; `children` otherwise |
| **API call** | `POST /api/v1/auth/refresh` — fire-and-forget on mount |
| **Redux** | Reads `auth.isInitialised`; dispatches `setCredentials`, `setInitialised` |

---

### `ProtectedRoute`

| Attribute | Detail |
|---|---|
| **File** | `src/components/shared/ProtectedRoute.tsx` |
| **Props** | None (uses `<Outlet>`) |
| **Behaviour** | If `!isInitialised` → `<LoadingSpinner />`; if `!accessToken` → dispatch `setReturnTo(location.pathname+search)`, `<Navigate to="/login" replace />`; else → `<Outlet />` |
| **Redux reads** | `auth.accessToken`, `auth.isInitialised` |
| **Redux writes** | `ui.returnTo` |

---

### `AppShell`

| Attribute | Detail |
|---|---|
| **File** | `src/components/layout/AppShell.tsx` |
| **Props** | None (uses `<Outlet>` for main content) |
| **Renders** | Top nav bar (app name + user email + Logout button) + `<main><Outlet /></main>` |
| **Logout interaction** | Calls `authApi.logout()` (fire-and-forget), dispatches `clearCredentials()`, removes localStorage refresh token, cancels refresh timer, navigates to `/login` |
| **Redux reads** | `auth.user.email` |

---

### `LoginPage`

| Attribute | Detail |
|---|---|
| **File** | `src/pages/LoginPage.tsx` |
| **Props** | None |
| **Behaviour** | If `accessToken` exists → `<Navigate to="/" replace />`; else render `<LoginForm>` |
| **Displays** | `auth.sessionExpiredMessage` as an info banner above the form (if set) |
| **Snapshot test** | Yes — default state + expired session state |

---

### `LoginForm`

| Attribute | Detail |
|---|---|
| **File** | `src/components/auth/LoginForm.tsx` |
| **Props** | None (dispatches internally) |
| **Form library** | React Hook Form + Zod resolver |
| **Fields** | `email` (type=email), `password` (type=password) |
| **Validation** | Email: valid format; password: non-empty |
| **Submit** | Calls `authApi.login()` → on success: `setCredentials`, store refresh token, `scheduleProactiveRefresh`, clear `sessionExpiredMessage`, `navigate(returnTo \|\| '/')`, `clearReturnTo()` |
| **On 401** | Toast "Invalid email or password"; clear password field |
| **On 429** | Toast "Too many attempts. Please try again later."; clear password field |
| **Inline errors** | Below each field; shown on blur and submit |
| **Submit button** | Disabled + shows spinner while request is in flight |
| **shadcn/ui** | `<Button>`, `<Input>`, `<Label>`, `<Form>`, `<FormField>`, `<FormMessage>` |

---

### `RegisterPage`

| Attribute | Detail |
|---|---|
| **File** | `src/pages/RegisterPage.tsx` |
| **Props** | None |
| **Behaviour** | If `accessToken` exists → `<Navigate to="/" replace />`; else render `<RegisterForm>` |
| **Snapshot test** | Yes |

---

### `RegisterForm`

| Attribute | Detail |
|---|---|
| **File** | `src/components/auth/RegisterForm.tsx` |
| **Props** | None |
| **Form library** | React Hook Form + Zod resolver |
| **Fields** | `email`, `password`, `confirmPassword` |
| **Validation** | Email: valid format; password: ≥ 8 chars; confirmPassword: must match password |
| **Submit** | Calls `authApi.register()` → on success: `setCredentials`, store refresh token, `scheduleProactiveRefresh`, `navigate('/')` |
| **On 409** | Toast "An account with this email already exists"; retain email, clear passwords |
| **On 429** | Toast "Too many attempts. Please try again later."; clear passwords |
| **Field preservation** | Email retained on all errors; passwords cleared on 4xx from server |
| **Submit button** | Disabled + spinner while in flight |
| **shadcn/ui** | Same as LoginForm |

---

### `DashboardPage` (placeholder)

| Attribute | Detail |
|---|---|
| **File** | `src/pages/DashboardPage.tsx` |
| **Content** | Heading "My Tasks" + placeholder text "Task list coming in UNIT-05" |
| **Implemented by** | UNIT-05 |

---

### `LoadingSpinner`

| Attribute | Detail |
|---|---|
| **File** | `src/components/shared/LoadingSpinner.tsx` |
| **Props** | `{ size?: 'sm' \| 'md' \| 'lg'; label?: string }` |
| **Renders** | Animated spinner SVG + optional screen-reader label |
| **Usage** | PersistAuth startup check; form submit loading state |

---

### `Toast` / Toaster

| Attribute | Detail |
|---|---|
| **File** | `src/components/shared/Toaster.tsx` |
| **Implementation** | shadcn/ui `<Toaster>` + `useToast` hook wired to Redux `ui.toasts` |
| **Variants** | `default` (info), `destructive` (error), `success` |
| **Duration** | 5 seconds auto-dismiss |
| **Position** | Bottom-right |
| **Usage** | `dispatch(addToast({ message, variant }))` from any component |

---

## State Management — authSlice

```
src/store/authSlice.ts

Actions:
  setCredentials({ accessToken, user })
  clearCredentials()
  setInitialised(boolean)
  setSessionExpiredMessage(string | null)

Selectors (exported):
  selectAccessToken(state)
  selectUser(state)
  selectIsInitialised(state)
  selectSessionExpiredMessage(state)
  selectIsAuthenticated(state)   // = accessToken !== null
```

---

## State Management — uiSlice

```
src/store/uiSlice.ts

Actions:
  setReturnTo(string | null)
  clearReturnTo()
  addToast({ message, variant })
  removeToast(id: string)

Selectors:
  selectReturnTo(state)
  selectToasts(state)
```

---

## RTK Query — authApi

```
src/store/api/authApi.ts

Base URL: /api/v1/auth

Endpoints:
  register(RegisterRequest)  → AuthResponse       POST /register
  login(LoginRequest)        → AuthResponse       POST /login
  refresh(RefreshRequest)    → RefreshResponse    POST /refresh
  logout(LogoutRequest)      → void               POST /logout
```

---

## baseQuery Configuration

```
src/store/api/apiSlice.ts

baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as RootState)
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  }
})

baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    // Attempt silent refresh (once)
    const refreshToken = localStorage.getItem('todo_refresh_token')
    if (refreshToken && !isRefreshRequest(args)) {
      const refreshResult = await baseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api, extraOptions
      )
      if (refreshResult.data) {
        const { accessToken, refreshToken: newRefresh } = refreshResult.data as RefreshResponse
        api.dispatch(setCredentials({ accessToken, user: selectUser(api.getState()) }))
        localStorage.setItem('todo_refresh_token', newRefresh)
        scheduleProactiveRefresh(decodeExp(accessToken), api.dispatch)
        result = await baseQuery(args, api, extraOptions)  // retry once
      } else {
        api.dispatch(setReturnTo(getCurrentPath()))
        api.dispatch(setSessionExpiredMessage('Your session has expired. Please log in again.'))
        api.dispatch(clearCredentials())
        localStorage.removeItem('todo_refresh_token')
        cancelScheduledRefresh()
        redirectToLogin()
      }
    } else {
      // Already a refresh request OR no refresh token — just redirect
      api.dispatch(clearCredentials())
      redirectToLogin()
    }
  }

  return result
}
```

---

## React Router Setup

```
src/App.tsx

<Routes>
  <Route path="/login"    element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<AppShell />}>
      <Route path="/"   element={<DashboardPage />} />
      {/* UNIT-05 task routes added here */}
    </Route>
  </Route>
</Routes>
```

---

## Test Coverage Map

| Component / Module | Test type | Vitest + RTL | Snapshot |
|---|---|---|---|
| `authSlice` | Unit | setCredentials, clearCredentials, selectors | No |
| `uiSlice` | Unit | setReturnTo, addToast, removeToast | No |
| `LoginForm` | Component | submit success, submit 401, submit 429, validation errors | Yes |
| `RegisterForm` | Component | submit success, submit 409, submit 429, validation, mismatch | Yes |
| `ProtectedRoute` | Component | renders outlet when auth; redirects when not | No |
| `PersistAuth` | Component | shows spinner → renders children after init | No |
| `AppShell` | Component | shows user email, logout click triggers flow | Yes |
| `LoginPage` | Component | renders form; shows expiry message | Yes |
| `RegisterPage` | Component | renders form; redirects when authenticated | Yes |
| `baseQueryWithReauth` | Integration | 401 → refresh → retry; 401 on refresh → redirect | No |
| PBT-05 | Property | email normalisation idempotency | No |
| PBT-CLIENT-01 | Property | valid Zod inputs always pass validation | No |
| PBT-CLIENT-02 | Property | clearCredentials invariant | No |
| PBT-CLIENT-03 | Property | localStorage cleared after logout | No |
