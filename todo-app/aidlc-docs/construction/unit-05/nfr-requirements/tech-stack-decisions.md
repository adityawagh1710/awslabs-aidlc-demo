# Tech Stack Decisions — UNIT-05: Frontend Task CRUD & Categories UI

## Inherited from UNIT-03 (unchanged)
React 18, Vite 6, TypeScript 5, RTK Query (bundled with RTK 2), React Router 6,
Tailwind CSS 3, shadcn/ui, React Hook Form 7, Zod 3, Vitest 2, React Testing Library,
MSW 2, @testing-library/user-event, @testing-library/jest-dom, jsdom,
ESLint 9, Prettier 3, npm, Node 22 LTS.

---

## UNIT-05 Additions

| Decision | Choice | Rationale |
|---|---|---|
| **ConfirmDialog primitive** | `@radix-ui/react-dialog` via shadcn/ui `dialog` component | Provides focus trap, `role="alertdialog"`, keyboard dismiss (Esc) out of the box; consistent with existing Radix pattern |
| **Sort dropdown primitive** | `@radix-ui/react-select` via shadcn/ui `select` component | Accessible keyboard navigation, matches shadcn/ui design system; used for SortControls "Sort by" field |
| **Route lazy loading** | `React.lazy` + `<Suspense fallback={<LoadingSpinner />}>` for TaskFormPage, TaskDetailPage, CategoryManagementPage | Keeps initial bundle at UNIT-03 target; page chunks loaded on first navigation |
| **Today's date validation** | Native `new Date()` with `setHours(0,0,0,0)` — no `date-fns` in frontend | Avoids adding date-fns to frontend bundle; server is authoritative for timezone validation |
| **Cache invalidation on logout** | `tasksApi.util.resetApiState()` + `categoriesApi.util.resetApiState()` dispatched on `clearCredentials` | Prevents stale task/category data from a previous user session appearing after login with different account |

---

## New npm Dependencies

| Package | Version | Install |
|---|---|---|
| `@radix-ui/react-dialog` | ^1.x | `npm install @radix-ui/react-dialog` |
| `@radix-ui/react-select` | ^2.x | `npm install @radix-ui/react-select` |

---

## No New Environment Variables
All configuration uses existing `VITE_API_URL` from UNIT-03.
