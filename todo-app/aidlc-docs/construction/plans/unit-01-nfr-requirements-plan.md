# NFR Requirements Plan — UNIT-01: DB & Infrastructure Foundation

## Context
UNIT-01 is the root infrastructure unit — no business logic exists here. Functional Design is
skipped. NFR Requirements is the first executed Construction stage and finalises the technology
versions, libraries, and configuration decisions that all downstream units inherit.

## Plan Checklist
- [x] Analysed unit definition (unit-of-work.md): pure infrastructure, Prisma + Fastify scaffold,
      Docker Compose, CI pipeline skeleton
- [x] Confirmed Functional Design skipped (no business logic in this unit)
- [x] Questions answered by user
- [x] NFR requirements artifacts generated
- [x] Artifacts approved

---

## Questions — Please Fill in Every `[Answer]:` Tag

### Q1 — Node.js Version
Both repos (`todo-backend` and `todo-frontend`) will share the same Node.js version pinned in
`.nvmrc` / `Dockerfile`. Node 20 "Iron" entered maintenance-only status on 2025-10-28 and reaches
End of Life 2026-04-30 (eight days from today). Node 22 "Jod" is the current active LTS (supported
until April 2027).

Which Node.js version should be used?

- A — Node 22 LTS (recommended — actively maintained, aligns with long-term project timeline)
- B — Node 20 LTS (maintenance mode, approaching EOL — not recommended)
- C — Node 23 (current/latest, not LTS — not recommended for production)

[Answer]:A

---

### Q2 — PostgreSQL Version
PostgreSQL version determines available features (e.g., `pg_trgm` for full-text search is
available in all recent versions, but generated columns and improved JSONB operators differ).

Which PostgreSQL version for the Docker Compose service?

- A — PostgreSQL 17 (latest stable, released Sep 2024 — recommended)
- B — PostgreSQL 16 (previous stable, widely deployed)
- C — PostgreSQL 15 (older stable, still supported)

[Answer]:A

---

### Q3 — Token Blacklist Storage Backend
The Prisma schema includes a `token_blacklist` table for JWT logout invalidation. An alternative is
using Redis with TTL-based expiry (tokens auto-expire without a periodic purge job).

Which backend should store blacklisted tokens?

- A — PostgreSQL only — keep the `token_blacklist` table; add a `pruneExpired` scheduled job
      (simpler stack, no new service, slightly higher DB load)
- B — Redis — add a `redis` service to Docker Compose; TTL-based auto-expiry means no purge job;
      better performance at scale (additional dependency)

[Answer]:B

---

### Q4 — Test Runner
Both Jest and Vitest are production-ready for TypeScript + Node.js backends.

- **Jest** — mature ecosystem, broad plugin library, more Stack Overflow answers; requires
  `ts-jest` or `babel-jest` transform; slightly slower cold start
- **Vitest** — native ESM, near-zero config with TypeScript, faster watch mode; shares Vite config
  (helpful when frontend also uses Vite)

Which test runner for `todo-backend`?

- A — Vitest (recommended — faster, zero-transform TypeScript, shares conventions with frontend)
- B — Jest (more familiar if your team already uses it elsewhere)

[Answer]:A

---

### Q5 — CI Platform
The unit-of-work lists "GitHub Actions or equivalent".

Which CI platform should the pipeline use?

- A — GitHub Actions (`.github/workflows/` — recommended if repo will be on GitHub)
- B — GitLab CI (`.gitlab-ci.yml`)
- C — No CI for now — generate the pipeline skeleton later

[Answer]:A

---

### Q6 — Password Hashing Algorithm
Auth endpoints will hash passwords. Two options are widely used in the Node.js ecosystem:

- **bcrypt** (`bcryptjs` pure-JS or `bcrypt` native bindings) — industry standard, cost factor
  configurable; pure-JS variant avoids native build issues in Docker
- **Argon2** (`argon2` npm package — OWASP recommended, winner of Password Hashing Competition;
  requires native bindings, slightly more complex Docker build)

Which algorithm for password hashing?

- A — bcrypt via `bcryptjs` (pure JS — simpler Docker build, well-understood)
- B — Argon2 via `argon2` (OWASP top recommendation, requires native build in Docker)

[Answer]:A

---

### Q7 — CORS Allowed Origins in Development
The Fastify server will register `@fastify/cors`. During local development the frontend dev server
runs on a different port than the backend.

What should the default CORS `origin` be for the development environment?

- A — `http://localhost:5173` (Vite default port — recommended)
- B — `http://localhost:3000` (if frontend will use a different port)
- C — `*` wildcard — allow all in development only (convenient but less strict)

[Answer]:C

---

### Q8 — Backend API Port
What TCP port should the Fastify server listen on locally?

- A — 3000 (common Express/Fastify default)
- B — 4000 (avoids conflicts if another service runs on 3000)
- C — 8080 (common alternative)

[Answer]:A
