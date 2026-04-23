# Business Rules — UNIT-03: Frontend Auth UI

## BR-01: Client-Side Form Validation

### RegisterForm Zod schema
```
email:           z.string().email('Please enter a valid email address')
password:        z.string().min(8, 'Password must be at least 8 characters')
confirmPassword: z.string()
  .refine((val) => val === password, 'Passwords do not match')
```

### LoginForm Zod schema
```
email:    z.string().email('Please enter a valid email address')
password: z.string().min(1, 'Password is required')
```

**Rule**: Client-side validation triggers on blur (per field) and on submit (all fields). Errors are shown inline below the relevant field. Submission is blocked while any field has an error.

---

## BR-02: Field Preservation on Error

| Scenario | Email field | Password fields |
|---|---|---|
| Client-side validation error (register) | Retained | Cleared |
| Client-side validation error (login) | Retained | Retained |
| 409 Conflict (duplicate email) | Retained | Cleared |
| 401 Unauthorized (wrong credentials) | Retained | Cleared |
| 429 Too Many Requests | Retained | Cleared |

---

## BR-03: Routing Rules

| Condition | Path visited | Result |
|---|---|---|
| Not initialised | Any | Render `<LoadingSpinner />` (no redirect yet) |
| Authenticated | `/login` or `/register` | Redirect to `/` |
| Unauthenticated | Any protected path | Store `returnTo`, redirect to `/login` |
| Unauthenticated | `/login` or `/register` | Render form normally |

---

## BR-04: Session Expiry Message

- Displayed only when redirect to `/login` is triggered by a 401 response or failed silent refresh.
- Message: `"Your session has expired. Please log in again."`
- Stored in `authSlice.sessionExpiredMessage`. Cleared on successful login.
- NOT displayed when user logs out voluntarily.

---

## BR-05: Return URL Behaviour

- `returnTo` is set only by `ProtectedRoute` (unauthenticated access) or the reactive 401 handler.
- After successful login, navigate to `returnTo` if set; otherwise navigate to `/`.
- `returnTo` is cleared immediately after consuming it in the login success handler.
- `returnTo` is NOT persisted to localStorage — it is ephemeral Redux state only.
- Maximum path length stored: unlimited (no truncation).

---

## BR-06: Token Storage Rules

| Token | Storage | Key | When set | When removed |
|---|---|---|---|---|
| Access token | Redux `authSlice.accessToken` | — | login / register / refresh success | logout / 401 failure / clearCredentials |
| Refresh token | localStorage | `todo_refresh_token` | login / register / refresh success | logout / refresh failure / clearCredentials |

**Access token is never written to localStorage, sessionStorage, or a cookie.**

---

## BR-07: Proactive Refresh Scheduling

- Refresh is scheduled at `exp - now - 120` seconds (2 minutes before expiry).
- Minimum schedule delay: if `exp - now - 120 <= 0`, trigger immediately (next tick via `setTimeout(..., 0)`).
- Only one refresh timer is active at a time. Previous timer is cancelled before scheduling a new one (stored as `refreshTimerId` ref in a custom hook or Redux middleware).

---

## BR-08: Single Retry on 401

- The reactive 401 handler retries the original request **at most once** after a successful token refresh.
- If the retry also returns 401, the error is returned to the caller without another refresh attempt.
- Prevents infinite refresh loops.

---

## BR-09: Logout Is Fire-and-Forget

- Client state (Redux + localStorage) is cleared immediately regardless of the server's response to `POST /logout`.
- If the network request fails, the client is still logged out locally.

---

## BR-10: Error Message Rules

| API error | User-facing message | Field cleared |
|---|---|---|
| 401 on login | "Invalid email or password" | password |
| 409 on register | "An account with this email already exists" | passwords |
| 429 on any auth route | "Too many attempts. Please try again later." | passwords |
| 400 (validation) | Server error message or "Invalid input" | none |
| 5xx / network error | "Something went wrong. Please try again." | none |

**Rule**: Never reveal which field (email or password) is incorrect on login.

---

## BR-11: PBT Invariants

| ID | Invariant |
|---|---|
| PBT-05 | `normalise(normalise(email)) === normalise(email)` where normalise = `trim().toLowerCase()` |
| PBT-CLIENT-01 | Any email + password passing Zod validation can be submitted (no unexpected blocking) |
| PBT-CLIENT-02 | `clearCredentials()` always sets `accessToken = null` and `user = null`, regardless of prior state |
| PBT-CLIENT-03 | After logout, `localStorage.getItem('todo_refresh_token')` is always `null` |
