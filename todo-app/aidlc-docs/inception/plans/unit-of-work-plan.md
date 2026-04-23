# Unit of Work Plan — TODO List App

Please answer each question by filling in the letter choice after the `[Answer]:` tag.
Let me know when you're done.

---

## Context Summary

From Application Design:
- **Two separate repos**: `todo-backend` (Fastify, layered, Prisma) and `todo-frontend` (React, Redux Toolkit, RTK Query)
- **Backend is a single deployable** (one Fastify server, not microservices)
- **Functional domains**: Auth/Users, Tasks, Categories, Search & Filter
- **18 user stories** across 5 epics

---

## Decomposition Questions

### Question 1
How should the backend be decomposed into units of work?

A) **Single backend unit** — All backend layers (Auth, Tasks, Categories, Search/Filter) developed as one unit. Simpler sequencing; all backend code ships together. Good for a small team or solo developer.
B) **Two backend units** — Split into: (1) Auth & User Management, (2) Task & Category Core (including search/filter). Natural domain boundary; Auth must exist before Tasks can be built.
C) **Three backend units** — Split into: (1) Auth & User Management, (2) Task CRUD & Categories, (3) Search, Filter & Pagination. Maximum granularity; good if different team members own each area.
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 2
Should database schema and infrastructure setup be a separate unit?

A) **Yes — separate Database/Infrastructure unit first** — Set up PostgreSQL schema (Prisma migrations), Docker Compose, environment configuration, and CI skeleton before any feature units. Creates a shared foundation all other units depend on.
B) **No — embed setup in the first feature unit** — Database schema and infrastructure setup is part of the first backend unit. Keeps related work together.
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
How should the frontend be treated?

A) **Single frontend unit** — The entire React SPA is one unit. All pages, components, Redux store, and RTK Query endpoints developed together.
B) **Two frontend units** — Split into: (1) Auth UI (login, register, session handling, ProtectedRoute), (2) Task Management UI (dashboard, task CRUD, categories, search/filter). Auth UI must exist before Task Management UI.
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 4
What is the preferred development sequence across units?

A) **Backend first, then frontend** — Complete all backend units before starting frontend. Frontend team works against a live API. Clearest integration point.
B) **Parallel development** — Backend and frontend units developed simultaneously. Frontend uses mock API or contract stubs while backend is built. Faster overall but requires API contract agreement upfront.
C) **Interleaved by feature** — Complete backend unit N, then immediately build the corresponding frontend unit N, then move to backend unit N+1. Tightest feedback loop but requires frequent context switching.
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Unit Generation Plan

Once questions are answered, the following artifacts will be generated:

### Artifacts to Generate
- [x] `aidlc-docs/inception/application-design/unit-of-work.md` — Unit definitions, responsibilities, and code organization
- [x] `aidlc-docs/inception/application-design/unit-of-work-dependency.md` — Inter-unit dependency matrix and build/development sequence
- [x] `aidlc-docs/inception/application-design/unit-of-work-story-map.md` — Mapping of all 18 user stories to units
