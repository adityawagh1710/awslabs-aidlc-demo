# Tech Stack Decisions — UNIT-07: Frontend Search, Filter & Pagination UI

## Inherited from UNIT-03 + UNIT-05 (unchanged)
React 18, Vite 6, TypeScript 5, RTK Query, React Router 6 (`useSearchParams`),
Tailwind CSS 3, shadcn/ui, React Hook Form 7, Zod 3, Vitest 2, RTL, MSW 2,
@radix-ui/react-dialog, @radix-ui/react-select, Node 22 LTS.

---

## UNIT-07 Additions

| Decision | Choice | Rationale |
|---|---|---|
| **Filter state location** | React Router `useSearchParams` (URL query params) — Q1:A | Shareable, bookmarkable, survives refresh; `useSearchParams` already available via React Router 6 (no new package) |
| **Search submit** | Local state + Enter key + "Search" button (Q2:C) | US-14 prohibits keystroke search; Enter is standard UX; button provides explicit affordance; both covered |
| **FilterBar layout** | Always-visible inline (Q3:A) | Simplest implementation; US-15 AC: "Filter controls are accessible from the task list view" — always visible satisfies this |
| **Active filter display** | Chips per filter + "Clear all" (Q4:C) | Best UX; individual removal reduces friction; "Clear all" for bulk reset |

---

## No New npm Dependencies
All functionality is achievable with the existing installed packages.
