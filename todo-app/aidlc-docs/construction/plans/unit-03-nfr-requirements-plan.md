# NFR Requirements Plan — UNIT-03: Frontend Auth UI

## Context
Functional design is complete. Tech stack largely decided via Q3–Q6. Assessing all NFR categories for residual decisions.

## Category Assessment

| Category | Status | Rationale |
|---|---|---|
| Scalability | N/A | SPA — no server-side scaling; static asset serving is hosting concern, out of scope |
| Performance | Question needed | Bundle size target not yet specified |
| Availability | N/A | SPA availability depends on hosting/CDN, not frontend code |
| Security | Mostly decided | Token storage (Q1:B) and XSS posture decided; one residual (CSP) |
| Tech Stack | Question needed | Package manager not yet specified |
| Reliability | N/A | Error handling patterns (ErrorBoundary, toast) fully designed in functional design |
| Maintainability | N/A | TypeScript strict + ESLint + Prettier follows backend conventions |
| Usability / Accessibility | Question needed | WCAG target not specified |

---

## Questions (3 residual decisions)

**Q1: Package Manager**

Which package manager for `todo-frontend`?

[A]: npm — consistent with `todo-backend`

[B]: pnpm — faster installs, strict hoisting, common in modern React projects

[C]: bun — fastest, but less mature ecosystem support for some dependencies

[Answer]: A

---

**Q2: Performance Budget**

Should the initial JavaScript bundle have a size budget enforced at build time?

[A]: Yes — warn when initial JS bundle exceeds 200 KB gzipped (Vite build warning threshold)

[B]: No formal budget — Vite defaults only, no enforced threshold for MVP

[Answer]: A

---

**Q3: Accessibility Target**

shadcn/ui (built on Radix UI) provides WCAG AA-compatible accessible components by default. Should the project formally target WCAG AA?

[A]: Yes — WCAG 2.1 AA is the formal target; all forms and interactive elements must meet AA criteria (handled by shadcn/ui + Radix UI + semantic HTML)

[B]: Best-effort only — use semantic HTML and shadcn/ui defaults; no formal audit planned for MVP

[Answer]: B

---

## Plan Checklist

- [x] Questions answered by user (Q1:A, Q2:A, Q3:B)
- [x] Ambiguities resolved
- [x] NFR requirements artifact created
- [x] Tech stack decisions artifact created
