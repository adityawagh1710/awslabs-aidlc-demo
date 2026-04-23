# Tech Stack Decisions — UNIT-03: Frontend Auth UI

## Runtime & Build

| Technology | Version | Decision | Rationale |
|---|---|---|---|
| Node.js | 22 LTS | Same as backend | Consistent toolchain; `.nvmrc` = `22` |
| Package manager | npm | Q1:A | Consistent with `todo-backend` |
| Build tool | Vite 6.x | Decided (unit-of-work) | Industry standard for React+TS projects; HMR, fast cold start |
| TypeScript | 5.x | Same as backend | Strict mode; `"target": "ES2022"`, `"module": "ESNext"` |

---

## UI Framework

| Technology | Version | Decision | Rationale |
|---|---|---|---|
| React | 18.x | Decided (unit-of-work) | Current stable; concurrent features available |
| React Router | 6.x | Decided (functional design) | Nested routes, `<Outlet>`, `<Navigate>` — all used in component design |
| Tailwind CSS | 3.x | Q3:B (functional design) | Utility-first; consistent with shadcn/ui |
| shadcn/ui | Latest | Q3:B (functional design) | Pre-built accessible components on Radix UI; fastest to build auth forms |

---

## State Management

| Technology | Version | Decision | Rationale |
|---|---|---|---|
| Redux Toolkit | 2.x | Decided (unit-of-work) | `authSlice`, `uiSlice`; RTK Query for API calls |
| RTK Query | (bundled with RTK) | Decided (unit-of-work) | `authApi` endpoints; `baseQueryWithReauth` for token refresh |

---

## Form & Validation

| Technology | Version | Decision | Rationale |
|---|---|---|---|
| React Hook Form | 7.x | Q5:A (functional design) | Uncontrolled inputs (no re-render per keystroke); `useForm`, `Controller` |
| Zod | 3.x | Q5:A (functional design) | Same library as backend; `zodResolver` from `@hookform/resolvers` |

---

## Testing

| Technology | Version | Decision | Rationale |
|---|---|---|---|
| Vitest | 2.x | Q6:C (functional design) | Same test runner as backend; native Vite integration |
| React Testing Library | Latest | Q6:C | Standard for React component tests; query by accessible role |
| MSW | 2.x | Derived from Q6:C | Mock Service Worker for RTK Query integration tests; intercepts at network level |
| @testing-library/user-event | Latest | Derived | Realistic user interaction simulation (type, click, tab) |
| vitest-dom | Latest | Derived | Extended DOM matchers (`toBeInTheDocument`, `toHaveValue`, etc.) |
| `@testing-library/jest-dom` | Latest | Derived | Snapshot + accessibility-aware assertions |
| jsdom | (via Vitest) | Derived | Test environment for DOM rendering |

---

## Dev Dependencies

| Tool | Decision | Rationale |
|---|---|---|
| ESLint 9 | Same config pattern as backend | `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` |
| Prettier | Same `.prettierrc` as backend | `semi: true, singleQuote: true, printWidth: 100, trailingComma: "all"` |
| `@types/react` + `@types/react-dom` | Latest | TypeScript definitions |

---

## Environment Variables (Vite)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:3000` | Backend base URL; used by RTK Query `fetchBaseQuery` |

`VITE_*` prefix exposes the variable to browser bundle. Non-sensitive (URL only, no secrets).

---

## Key Version Constraints

- React 18 requires `react-dom@18` — no mixing with React 19 (not yet stable)
- shadcn/ui requires Tailwind CSS 3.x (not compatible with Tailwind 4.x as of April 2026)
- MSW 2.x requires explicit `setupFiles` in Vitest config for service worker registration
- RTK Query `fetchBaseQuery` uses the browser `fetch` API — no polyfill needed (Node 22 + modern browsers)
