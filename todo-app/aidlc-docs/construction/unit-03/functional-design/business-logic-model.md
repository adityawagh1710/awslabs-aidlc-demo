# Business Logic Model — UNIT-03: Frontend Auth UI

## Auth Flow Overview

```
Register → setCredentials → storeRefreshToken → scheduleProactiveRefresh → navigate(/)
Login    → setCredentials → storeRefreshToken → scheduleProactiveRefresh → navigate(returnTo || /)
Logout   → POST /logout  → clearCredentials  → removeRefreshToken       → navigate(/login)
401      → attemptRefresh → [success] retry  → [fail] clearCredentials  → navigate(/login?expired=1)
Startup  → readLocalStorage → POST /refresh  → setCredentials           → scheduleProactiveRefresh
```

---

## Flow 1 — App Startup (Page Refresh)

Executed once by `PersistAuth` component on mount before routing begins.

```
mount PersistAuth
    │
    ▼
read localStorage.getItem('todo_refresh_token')
    ├── null → dispatch setInitialised(true) → render routes (unauthenticated)
    └── token found
            │
            ▼
        POST /api/v1/auth/refresh { refreshToken }
            ├── 200 → dispatch setCredentials({ accessToken, user })
            │         storeRefreshToken(refreshToken)
            │         scheduleProactiveRefresh(accessToken.exp)
            │         dispatch setInitialised(true)
            │         render routes (authenticated)
            └── error → removeRefreshToken()
                        dispatch setInitialised(true)
                        render routes (unauthenticated)
```

**Constraint**: Routes are not rendered until `isInitialised === true` (prevents flash of /login).

---

## Flow 2 — Register

```
RegisterForm submit (email, password, confirmPassword)
    │
    ▼
RHF+Zod client-side validation
    ├── invalid → show inline field errors, abort
    └── valid
            │
            ▼
        POST /api/v1/auth/register { email, password }
            ├── 201 → dispatch setCredentials({ accessToken, user })
            │         storeRefreshToken(refreshToken)
            │         scheduleProactiveRefresh(accessToken.exp)
            │         navigate('/')
            ├── 409 → show toast: "An account with this email already exists"
            ├── 429 → show toast: "Too many attempts. Please try again later."
            └── other error → show toast: "Registration failed. Please try again."
```

**Email field retained on error; password fields cleared.**

---

## Flow 3 — Login

```
LoginForm submit (email, password)
    │
    ▼
RHF+Zod client-side validation
    ├── invalid → show inline field errors, abort
    └── valid
            │
            ▼
        POST /api/v1/auth/login { email, password }
            ├── 200 → dispatch setCredentials({ accessToken, user })
            │         storeRefreshToken(refreshToken)
            │         scheduleProactiveRefresh(accessToken.exp)
            │         navigate(returnTo || '/')
            │         dispatch clearReturnTo()
            ├── 401 → show toast: "Invalid email or password"
            │         password field cleared
            ├── 429 → show toast: "Too many attempts. Please try again later."
            └── other error → show toast: "Login failed. Please try again."
```

---

## Flow 4 — Logout

```
User clicks Logout (AppShell nav)
    │
    ▼
POST /api/v1/auth/logout
    { headers: { Authorization: Bearer <accessToken> },
      body: { refreshToken } }
    │
    ▼ (fire-and-forget — clear state regardless of server response)
dispatch clearCredentials()
    ├── accessToken → null
    └── user → null
removeRefreshToken()           // localStorage.removeItem('todo_refresh_token')
cancelScheduledRefresh()       // clearTimeout(refreshTimerId)
navigate('/login')
```

**Logout is fire-and-forget**: client state is always cleared even if the POST fails.

---

## Flow 5 — Proactive Token Refresh

Scheduled after every successful token acquisition (login, register, silent refresh).

```
scheduleProactiveRefresh(exp: number)
    │
    ▼
timeUntilRefresh = (exp - Math.floor(Date.now()/1000) - 120) * 1000
    ├── timeUntilRefresh <= 0 → trigger immediately
    └── timeUntilRefresh > 0  → setTimeout(silentRefresh, timeUntilRefresh)

silentRefresh()
    │
    ▼
readRefreshToken from localStorage
    ├── null → clearCredentials() → navigate('/login')
    └── token found
            │
            ▼
        POST /api/v1/auth/refresh { refreshToken }
            ├── 200 → dispatch setCredentials({ accessToken, user })
            │         storeRefreshToken(newRefreshToken)
            │         scheduleProactiveRefresh(newAccessToken.exp)
            └── error → clearCredentials()
                        removeRefreshToken()
                        navigate('/login?expired=1')
```

---

## Flow 6 — Reactive 401 Handling (RTK Query baseQuery)

Intercepts any 401 response from the API.

```
API response 401
    │
    ├── request was POST /refresh → already failing
    │       clearCredentials()
    │       removeRefreshToken()
    │       cancelScheduledRefresh()
    │       dispatch setReturnTo(currentPath)
    │       dispatch setSessionExpiredMessage('Your session has expired. Please log in again.')
    │       navigate('/login')
    │       return error (do not retry)
    │
    └── any other request
            │
            ▼
        readRefreshToken from localStorage
            ├── null → same as above (clearCredentials + navigate /login)
            └── token found
                    │
                    ▼
                POST /api/v1/auth/refresh { refreshToken }
                    ├── 200 → dispatch setCredentials({ accessToken, user })
                    │         storeRefreshToken(newRefreshToken)
                    │         scheduleProactiveRefresh(newAccessToken.exp)
                    │         retry original request with new accessToken
                    │         return result
                    └── error → clearCredentials()
                                removeRefreshToken()
                                dispatch setReturnTo(currentPath)
                                dispatch setSessionExpiredMessage(...)
                                navigate('/login')
                                return error
```

**Retry once only** — the second attempt is not wrapped in 401 handling.

---

## Flow 7 — Protected Route Guard

```
ProtectedRoute renders
    │
    ├── isInitialised === false → render <LoadingSpinner /> (startup check in progress)
    ├── accessToken !== null    → render <Outlet /> (authenticated content)
    └── accessToken === null
            │
            ▼
        dispatch setReturnTo(location.pathname + location.search)
        navigate('/login', { replace: true })
```

---

## Flow 8 — Public Route Guard (Login / Register)

```
LoginPage / RegisterPage renders
    │
    ├── accessToken !== null → navigate('/', { replace: true })
    └── accessToken === null → render form
```

---

## Helper: JWT Decode for exp Claim

```
decodeExp(token: string): number
    → base64url decode the payload section (token.split('.')[1])
    → JSON.parse → return payload.exp
    (no signature verification — trust is established by the backend, this is for scheduling only)
```
