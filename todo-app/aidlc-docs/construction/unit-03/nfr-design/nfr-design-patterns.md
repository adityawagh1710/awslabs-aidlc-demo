# NFR Design Patterns — UNIT-03: Frontend Auth UI

---

## Pattern 1 — In-Memory Access Token (Security)

**Problem**: Storing JWTs in localStorage exposes them to XSS theft.

**Solution**: Access token stored exclusively in Redux `authSlice.accessToken` (JavaScript heap). Never written to localStorage, sessionStorage, cookies, or URL params. Survives only for the duration of the browser session tab.

**Consequence**: Token lost on page refresh → mitigated by Pattern 5 (Startup Auth Persistence).

---

## Pattern 2 — Sliding Proactive Refresh (Performance / UX)

**Problem**: 15-minute access tokens expire mid-session, causing user-visible 401s on authenticated requests.

**Solution**: After every token acquisition, schedule a `setTimeout` to fire 2 minutes before the access token's `exp` claim. The timer calls `silentRefresh()` which exchanges the localStorage refresh token for a new pair without user interaction. After success, the new timer is scheduled for the next cycle.

```
Token acquired (exp = now + 900s)
    → setTimeout(silentRefresh, (900 - 120) * 1000)   // fires at t+780s
    → silentRefresh() → new token (exp = now + 900s)
    → setTimeout(silentRefresh, 780s)
    → ...
```

**Timer registry**: Module-level `refreshTimerId` (not Redux — timers are not serializable). Cancelled on logout or auth failure before scheduling a replacement.

---

## Pattern 3 — Single-Retry baseQuery with Token Refresh (Resilience)

**Problem**: Access tokens can expire between the proactive refresh schedule and an API call (e.g., tab sleep, clock drift).

**Solution**: RTK Query `baseQueryWithReauth` wraps every API call. On any 401:
1. If the failed request is itself a `/refresh` call → skip retry, clear auth, redirect.
2. Otherwise: attempt one `/refresh`, update credentials, **retry the original request once**.
3. If the retry also 401s → clear auth, redirect.

**Invariant**: Maximum one token refresh attempt per request. Prevents infinite refresh loops.

---

## Pattern 4 — Fire-and-Forget Logout (Resilience)

**Problem**: Network failure during `POST /logout` could leave the user stuck in an authenticated state client-side.

**Solution**: Client state (Redux + localStorage) is cleared synchronously before the server response arrives. `POST /logout` is fire-and-forget — the client is always logged out locally regardless of server outcome.

**Implementation**: In `AppShell.logout()`:
```
dispatch(clearCredentials())                    // synchronous
localStorage.removeItem('todo_refresh_token')  // synchronous
cancelScheduledRefresh()                        // synchronous
navigate('/login')                              // synchronous
POST /api/v1/auth/logout (...)                  // async, ignored
```

---

## Pattern 5 — Startup Auth Persistence (UX / Performance)

**Problem**: Page refresh loses the in-memory access token, requiring re-login even if the user has a valid 7-day refresh token.

**Solution**: `PersistAuth` component runs on mount before any routes render. It reads `localStorage.getItem('todo_refresh_token')` and, if present, calls `POST /refresh` to silently recover the access token. Routes are held behind a loading spinner until `isInitialised = true`.

**Failure path**: If the refresh fails (token expired/revoked), the localStorage token is removed and the user is sent to `/login`. No error is shown — the login page is the natural unauthenticated state.

---

## Pattern 6 — Route Guard Sequence (Security / UX)

**Problem**: Rendering protected routes before the auth state is known causes a flash of either login page or dashboard.

**Solution**: Two-stage guard in `ProtectedRoute`:
1. `isInitialised === false` → render `<LoadingSpinner />` (blocks routing until Pattern 5 completes)
2. `accessToken === null` → store `returnTo`, redirect to `/login`
3. `accessToken !== null` → render `<Outlet />`

Public routes (`/login`, `/register`) inverse-check: if `accessToken !== null` → redirect to `/`.

---

## Pattern 7 — Vite Automatic Code Splitting (Performance)

**Problem**: Shipping all route code in a single bundle exceeds the 200 KB gzipped limit as the app grows (UNIT-05, UNIT-07).

**Solution**: Vite splits chunks at dynamic `import()` boundaries. In UNIT-03, the auth pages are the primary bundle. Future routes (tasks, categories) will be lazily imported via `React.lazy()` in subsequent units. The Vite `build.chunkSizeWarningLimit: 200` warning will surface any overage at build time.

---

## Pattern 8 — ErrorBoundary Isolation (Resilience)

**Problem**: Uncaught render errors in any component crash the entire React tree.

**Solution**: `ErrorBoundary` class component wraps the entire app. On `componentDidCatch`, it renders a static fallback UI ("Something went wrong" + reload button). Stack trace is never shown to the user.

**Scope**: Catches synchronous render errors only. Async errors (event handlers, fetch callbacks) are handled by try/catch + toast notifications.

---

## Pattern 9 — Ephemeral Return URL (UX)

**Problem**: After session expiry, the user should return to the page they were on — but `returnTo` must not persist across tab closes (it becomes stale).

**Solution**: `returnTo` is stored in Redux `uiSlice` (in-memory, not localStorage). Survives SPA navigation within the tab. Lost on page refresh — acceptable because on refresh, Pattern 5 attempts silent re-auth and the user stays on `/` (dashboard) anyway.

**Cleared immediately** after successful login to prevent stale redirects on subsequent logins.

---

## Pattern 10 — Uncontrolled Form Inputs (Performance)

**Problem**: Controlled inputs update React state on every keystroke, causing re-renders that can feel laggy on slow devices.

**Solution**: React Hook Form registers inputs as uncontrolled (ref-based). State is read only on blur (validation) and submit. No re-render per keystroke. Error state updates (on blur/submit) are the only React state changes during form interaction.

**Zod integration**: `zodResolver` runs Zod schema validation at blur and submit. Schema is defined once per form; the same Zod types serve as TypeScript type inference source.
