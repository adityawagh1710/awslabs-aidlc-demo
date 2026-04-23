# Infrastructure Design Plan — UNIT-03: Frontend Auth UI

## Context
UNIT-03 creates a new `todo-frontend/` repository. UNIT-01 already has a docker-compose.yml with `db`, `redis`, and `api` services, and a backend Dockerfile. This stage decides how the frontend fits into that existing local development environment.

## Category Assessment

| Category | Status | Rationale |
|---|---|---|
| Deployment Environment | Question needed | Docker integration not yet specified |
| Compute Infrastructure | Question needed | Vite dev server: inside Docker or outside? |
| Storage Infrastructure | N/A | SPA has no storage infrastructure |
| Messaging Infrastructure | N/A | SPA has no messaging infrastructure |
| Networking Infrastructure | Question needed | API URL strategy: Vite proxy vs. direct call |
| Monitoring Infrastructure | N/A | No monitoring tooling for MVP frontend |
| Shared Infrastructure | Derived | Existing docker-compose.yml may be extended |

---

## Questions

**Q1: Docker Service for Frontend Dev Server**

Should the Vite dev server be added as a `frontend` service in the existing docker-compose.yml?

[A]: Yes — add a `frontend` service to docker-compose.yml using the `development` Dockerfile target. `npm run dev` runs inside the container; source is bind-mounted for HMR.

[B]: No — run `npm run dev` locally outside Docker. The backend services (db, redis, api) run in Docker; the frontend runs natively on the developer's machine.

[Answer]: A

---

**Q2: API URL Strategy for Local Development**

How should the frontend reach the backend during development?

[A]: Vite proxy — configure `vite.config.ts` to proxy `/api/*` requests to `http://localhost:3000` (or `http://api:3000` if both are in Docker). Keeps `VITE_API_URL` empty or just `/` in dev.

[B]: Direct URL — set `VITE_API_URL=http://localhost:3000` in `.env.local`. The frontend calls the backend directly; CORS is already configured on the backend with `@fastify/cors`.

[Answer]: A

---

**Q3: Production Dockerfile**

Should `todo-frontend` have a multi-stage Dockerfile for production builds?

[A]: Yes — multi-stage: `base` (npm install) → `builder` (vite build) → `production` (Nginx Alpine serving `/dist`). Consistent with the backend Dockerfile pattern from UNIT-01.

[B]: No — defer the Dockerfile until an Operations phase. For now, `npm run build` produces static assets that can be served by any hosting provider.

[Answer]: A

---

## Plan Checklist

- [x] Questions answered by user (Q1:A, Q2:A, Q3:A)
- [x] Ambiguities resolved
- [x] Infrastructure design artifact created
- [x] Deployment architecture artifact created
