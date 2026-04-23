# NFR Requirements — UNIT-03: Frontend Auth UI

## Performance

| Requirement | Target | Enforcement |
|---|---|---|
| Initial JS bundle | < 200 KB gzipped | Vite `build.chunkSizeWarningLimit: 200` — build warns if exceeded |
| Code splitting | Auth + dashboard chunks separated | Vite automatic chunk splitting via dynamic `import()` for future routes |
| Dev server startup | < 3 s (Vite HMR) | Vite default; no additional config needed |
| Form validation | < 16 ms per keystroke (< 1 frame) | React Hook Form uncontrolled inputs; no re-render per keystroke |

---

## Security

| Requirement | Implementation |
|---|---|
| XSS — access token | Access token stored in Redux in-memory only. Never written to localStorage, sessionStorage, cookies, or URL params. |
| XSS — refresh token | Refresh token in localStorage (`todo_refresh_token`). Risk accepted for MVP (enables silent re-auth after page refresh). |
| Token in URL | Tokens must never appear in URL query params or hash fragments |
| HTTPS enforcement | `VITE_API_URL` must always use `https://` in production builds; enforced by environment validation at app startup |
| Input sanitisation | shadcn/ui + browser native form validation prevents basic injection; API validates server-side (UNIT-02). No HTML rendering of user input in UNIT-03 scope. |
| Dependency supply chain | `npm audit` run as part of CI lint job; no `--legacy-peer-deps` in install |
| CSP | Handled at hosting/server level (out of scope for frontend code) |

---

## Reliability

| Requirement | Implementation |
|---|---|
| Unhandled render errors | `<ErrorBoundary>` at app root renders fallback UI; never shows raw stack trace to user |
| API error surfacing | All auth API errors surfaced via toast notifications (no silent failures) |
| Logout on network failure | Client state cleared regardless of server response (fire-and-forget) |
| Startup refresh failure | App renders unauthenticated state (login page) — does not block render |
| Single 401 retry | `baseQueryWithReauth` retries original request at most once after token refresh; prevents refresh loops |

---

## Maintainability & Testability

| Requirement | Implementation |
|---|---|
| TypeScript | Strict mode (`"strict": true`) — same settings as backend |
| Linting | ESLint 9 flat config + `@typescript-eslint/recommended` + `eslint-plugin-react` + `eslint-plugin-react-hooks` |
| Formatting | Prettier (same `.prettierrc` as backend) |
| Test coverage | Vitest + React Testing Library (RTL) + snapshot tests; no enforced coverage threshold for MVP |
| API mocking | MSW 2.x (Mock Service Worker) for integration-level component tests |
| Snapshot tests | Vitest `.toMatchSnapshot()` for: LoginPage, RegisterPage, AppShell, LoginForm, RegisterForm |
| CI integration | Frontend lint, type-check, and test jobs added to `.github/workflows/ci.yml` |

---

## Accessibility

| Requirement | Implementation |
|---|---|
| Target | Best-effort — no formal WCAG 2.1 AA audit for MVP |
| Component accessibility | shadcn/ui components built on Radix UI — ARIA roles, keyboard navigation, focus management provided by default |
| Semantic HTML | All forms use `<label>` + `<input>` associations; headings use correct `<h1>`/`<h2>` hierarchy |
| Focus management | React Router navigations do not require manual focus reset (Radix UI handles dialog/popover focus) |
| Screen reader text | `<LoadingSpinner>` includes visually-hidden `aria-label`; error messages linked to fields via `aria-describedby` |

---

## Usability

| Requirement | Implementation |
|---|---|
| Loading feedback | Spinner shown during PersistAuth startup check; submit buttons show spinner and disable during in-flight requests |
| Error feedback | Inline field errors on blur + submit; toast notifications for server errors (5 s auto-dismiss, bottom-right) |
| Session expiry message | Informational banner on /login when redirected by 401 ("Your session has expired. Please log in again.") |
| Form field preservation | Email retained on error; passwords cleared on server error (BR-02) |
| Responsive layout | Tailwind responsive utilities; auth forms centred and readable on mobile (min-width 320 px) |
