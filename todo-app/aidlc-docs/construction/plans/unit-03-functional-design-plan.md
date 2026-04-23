# Functional Design Plan — UNIT-03: Frontend Auth UI

## Unit Context
- **Repository**: `todo-frontend/` (new — greenfield scaffold)
- **Type**: Feature — Frontend (React + Vite + TypeScript)
- **Stories implemented**: US-01 (register frontend AC), US-02 (login frontend AC), US-03 (logout frontend AC), US-04 (session expiry frontend AC)
- **Dependencies**: UNIT-02 (live auth API: POST /register, /login, /logout, /refresh)

## Functional Design Scope

### Components to design
- Redux store (authSlice, apiSlice base, authApi RTK Query)
- ProtectedRoute + React Router setup (/login, /register, /)
- LoginPage + LoginForm
- RegisterPage + RegisterForm
- AppShell (nav bar with logout, main content placeholder)
- SessionExpiryHandler (401 intercept in baseQuery)
- Toast / notification for auth errors
- ErrorBoundary at app root

### Key design decisions requiring user input (6 questions below)

---

## Questions

**Q1: Token Storage Strategy**

US-02 acceptance criteria states tokens should use "HttpOnly, Secure, SameSite=Strict cookie attributes." The UNIT-02 backend returns tokens in the response body (not as Set-Cookie headers). How should the frontend store the access token?

[A]: In Redux state (in-memory only) — most secure against XSS; token is lost on page refresh, user must re-login after browser close/refresh. No localStorage.

[B]: In-memory Redux + persist refreshToken in localStorage — access token stays in memory (XSS-safe), refresh token in localStorage enables silent re-auth after page refresh.

[C]: Modify the approach — store both tokens in localStorage (simplest, less secure). Accept the XSS risk for MVP.

[Answer]: B

---

**Q2: Silent Token Refresh Behaviour**

The backend issues 15-minute access tokens and 7-day refresh tokens. When should the frontend refresh the access token?

[A]: Reactive only — only attempt refresh when the backend returns 401 (RTK Query baseQuery intercepts 401, calls `/refresh`, retries original request). Simple but the user briefly sees a 401.

[B]: Proactive + reactive — refresh the access token ~2 minutes before it expires (using the JWT `exp` claim), and also handle any unexpected 401s reactively. More complex but seamless.

[Answer]: B

---

**Q3: CSS Framework**

The unit-of-work plan says "Tailwind CSS (or chosen CSS framework)". Which would you like?

[A]: Tailwind CSS v3 only — utility-first classes, no pre-built component library. You write all component styles yourself.

[B]: Tailwind CSS v3 + shadcn/ui — pre-built accessible components (Button, Input, Form, Toast, Card) built on Radix UI primitives. Fastest to build; opinionated but highly customisable.

[C]: CSS Modules — scoped CSS files per component, no utility framework. No external dependency beyond Vite defaults.

[Answer]: B

---

**Q4: Return URL After Session Expiry**

US-04 says "After re-authentication, the user is returned to the page they were on when the session expired (if practical)." Should we implement this?

[A]: Yes — before redirecting to /login on a 401, store the current path in state; after successful login, redirect to that path instead of the dashboard.

[B]: No — always redirect to the dashboard (/dashboard or /) after login. Simpler implementation.

[Answer]: A

---

**Q5: Form Validation Approach**

The register form needs: email format, password ≥ 8 chars, password confirmation match. The login form needs: email format, non-empty password. Which approach?

[A]: React Hook Form — lightweight library, uncontrolled inputs, resolver for Zod schema validation. Consistent with backend Zod usage.

[B]: Plain controlled inputs — useState for each field, manual validation on submit/blur. No additional library.

[Answer]: A

---

**Q6: Test Approach for UNIT-03**

[A]: Unit + component tests with Vitest + React Testing Library (RTL) — test form validation logic, Redux slice reducers, and component render/interaction. MSW (Mock Service Worker) to mock API calls.

[B]: Component tests only — Vitest + RTL for component behaviour; no RTK Query/MSW integration tests in this unit (integration tested manually against UNIT-02 backend).

[C]: Unit + component + visual snapshot tests — add Vitest snapshot testing for key components alongside RTL interaction tests.

[Answer]: C

---

## Plan Checklist

- [x] Questions answered by user (Q1:B, Q2:B, Q3:B, Q4:A, Q5:A, Q6:C)
- [x] Ambiguities resolved
- [x] Business logic model artifact created
- [x] Business rules artifact created
- [x] Domain entities artifact created
- [x] Frontend components artifact created
