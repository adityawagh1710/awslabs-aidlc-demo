# NFR Requirements — UNIT-01: DB & Infrastructure Foundation

## Performance Requirements

| Requirement | Target | Rationale |
|---|---|---|
| Health check latency | p99 < 50 ms | Health probes run frequently; must not add load |
| Fastify startup time | < 3 s | Acceptable cold-start in Docker; CI startup budget |
| Database connection pool | min 2, max 10 connections | Sufficient for development; tunable via env var for production |
| Redis connection | Single persistent connection with reconnect strategy | Blacklist lookups on every authenticated request |
| Prisma query logging | Enabled in development, disabled in production | Log slow queries (> 100 ms) in production only |

## Scalability Requirements

| Requirement | Detail |
|---|---|
| Stateless API server | No in-process session state; allows horizontal scaling |
| Externalized token blacklist | Redis — shared state accessible to any API replica |
| Database migrations | Prisma Migrate — deterministic, idempotent, runnable in CI |
| Environment-driven configuration | All tuneable values in env vars; no hardcoded capacity assumptions |

## Availability Requirements

| Requirement | Detail |
|---|---|
| Local development | Docker Compose brings up PostgreSQL + Redis + API; `docker compose up --build` is the single entry point |
| Health check endpoint | `GET /health` returns `{ "status": "ok", "timestamp": "<ISO>" }` — used by Docker `HEALTHCHECK` and future load balancers |
| Graceful shutdown | Fastify `closeGracefully` + drain in-flight requests before process exit |
| Dependency health | Health check verifies DB connectivity (Prisma `$queryRaw SELECT 1`) and Redis ping |

## Security Requirements

Security Baseline extension (SECURITY-01 – SECURITY-15) is fully enforced. UNIT-01 establishes the
security foundation that all downstream units inherit.

| Rule | UNIT-01 Implementation |
|---|---|
| SECURITY-01 Encryption at rest | PostgreSQL data volume in Docker; production encryption via cloud provider (out of scope for UNIT-01) |
| SECURITY-02 Audit logging | Structured pino logger wired at Fastify plugin level; request/response logging (excluding sensitive fields) |
| SECURITY-03 HTTP security headers | `@fastify/helmet` plugin registered in `app.ts` with strict defaults |
| SECURITY-04 Input validation | `@fastify/sensible` + JSON schema per route (scaffolded in UNIT-01, populated in UNIT-02+) |
| SECURITY-05 Least privilege | PostgreSQL user `todo_app` owns only the `todo` database; no superuser |
| SECURITY-06 Network configuration | Docker network isolation; PostgreSQL and Redis ports not exposed to host in production compose profile |
| SECURITY-07 IDOR prevention | N/A — no business resources in UNIT-01 |
| SECURITY-08 Hardening | `NODE_ENV` enforced; production Docker image uses non-root user `node` |
| SECURITY-09 Supply chain | `npm ci` in Dockerfile (not `npm install`); lockfile committed |
| SECURITY-10 Secure design | Layered architecture enforced from scaffold (controller → service → repository); no cross-layer imports |
| SECURITY-11 Auth/credential mgmt | JWT secret, DB URL, Redis URL loaded from env vars; `.env.example` documents all vars; `.env` in `.gitignore` |
| SECURITY-12 Integrity | TypeScript strict mode; ESLint `@typescript-eslint/recommended` ruleset |
| SECURITY-13 Alerting | pino log level configurable via `LOG_LEVEL` env var; ERROR events logged with stack trace |
| SECURITY-14 Exception handling | Global Fastify error handler normalises all errors to `{ error, message }` shape; stack traces suppressed in production |
| SECURITY-15 CORS | Development: `origin: "*"` (Q7-C answer); Production: `origin: CORS_ORIGIN` env var (must be explicit) |

## Reliability Requirements

| Requirement | Detail |
|---|---|
| TypeScript strict mode | `"strict": true` in tsconfig.json — catches null/undefined errors at compile time |
| Linting | ESLint with `@typescript-eslint/recommended` + `import/order` rules; enforced in CI |
| Formatting | Prettier with project-level config; enforced via `prettier --check` in CI |
| Test isolation | Vitest with separate test database (different DB name via `DATABASE_URL_TEST` env var) |
| CI gates | Lint → type-check → test → build — all must pass; no merge without green CI |

## Maintainability Requirements

| Requirement | Detail |
|---|---|
| Environment config | `src/config/env.ts` uses `zod` for schema validation of all env vars at startup; fails fast with clear error message if any required var is missing |
| Docker targets | `Dockerfile` has `development` and `production` targets (multi-stage build) |
| Structured logging | pino JSON logger; log fields: `requestId`, `method`, `url`, `statusCode`, `responseTime`, `userId` (when available) |
| Schema migrations | All Prisma migrations committed to source; migration history is canonical |
