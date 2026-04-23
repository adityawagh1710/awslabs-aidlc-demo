# Code Generation Summary — UNIT-01: DB & Infrastructure Foundation

All files created at `todo-backend/` (workspace root).

## Created Files

### Project Skeleton
- `package.json` — all runtime + dev dependencies; 14 npm scripts
- `tsconfig.json` — TypeScript strict mode, CommonJS, ES2022 target
- `tsconfig.build.json` — production build config (excludes tests)
- `eslint.config.js` — ESLint 9 flat config with @typescript-eslint/recommended
- `.prettierrc` — code formatting rules
- `.prettierignore`
- `.gitignore` — ignores node_modules, dist, .env, data/, coverage/
- `.nvmrc` — pins Node.js 22
- `.env.example` — 13 env vars documented with placeholder values
- `.dockerignore`
- `vitest.config.ts` — Vitest with v8 coverage, 10 s timeout

### Source: Config & Domain
- `src/config/env.ts` — zod env schema; hard-exits with clear error if any required var missing
- `src/domain/errors.ts` — 6 typed domain error classes (NotFoundError, ForbiddenError, ConflictError, UnauthorizedError, ValidationError, ServiceUnavailableError)
- `src/types/fastify.d.ts` — TokenPayload interface; FastifyInstance decorated with `redis` + `authenticate`; FastifyRequest decorated with `user`

### Source: Fastify Plugins
- `src/plugins/logger.ts` — pino-pretty in dev, raw JSON in production; sensitive field redaction
- `src/plugins/redis.ts` — ioredis singleton; exponential backoff retry; fastify.decorate('redis'); onClose cleanup
- `src/plugins/security.ts` — @fastify/helmet, @fastify/cors (env-aware origin), @fastify/rate-limit (200/15min)
- `src/plugins/auth.ts` — @fastify/jwt registration; `authenticate` preHandler (JWT verify + fail-closed Redis blacklist check)
- `src/plugins/error-handler.ts` — global Fastify error handler; maps domain errors to HTTP status; strips stack traces in production

### Source: Routes & App
- `src/routes/health.ts` — GET /health; parallel DB + Redis checks with 2 s timeout; 200 or 503
- `src/routes/auth.routes.ts` — stub (UNIT-02)
- `src/routes/tasks.routes.ts` — stub (UNIT-04)
- `src/routes/categories.routes.ts` — stub (UNIT-04)
- `src/controllers/auth.controller.ts` — stub (UNIT-02)
- `src/controllers/tasks.controller.ts` — stub (UNIT-04)
- `src/controllers/categories.controller.ts` — stub (UNIT-04)
- `src/services/auth.service.ts` — stub (UNIT-02)
- `src/services/task.service.ts` — stub (UNIT-04)
- `src/services/category.service.ts` — stub (UNIT-04)
- `src/services/user.service.ts` — stub (UNIT-02)
- `src/services/token.service.ts` — stub (UNIT-02)
- `src/repositories/prisma-client.ts` — PrismaClient singleton; test/dev DB URL switching
- `src/repositories/user.repository.ts` — stub (UNIT-02)
- `src/repositories/task.repository.ts` — stub (UNIT-04)
- `src/repositories/category.repository.ts` — stub (UNIT-04)
- `src/repositories/task-category.repository.ts` — stub (UNIT-04)
- `src/repositories/token-blacklist.repository.ts` — **fully implemented** (Redis SET/EXISTS with `blacklist:{jti}` key pattern)
- `src/app.ts` — Fastify app factory; plugin registration in defined order; returns instance without calling listen()
- `src/server.ts` — entry point; fail-fast DB + Redis checks; listen(); SIGTERM/SIGINT graceful shutdown with 10 s hard kill

### Database
- `prisma/schema.prisma` — User, Task (TaskStatus/Priority enums), Category, TaskCategory models; all indexes; **no token_blacklist model** (Redis handles blacklisting)

### Infrastructure
- `Dockerfile` — 4-stage: base → development (tsx watch) → builder (tsc) → production (non-root appuser, devDeps excluded)
- `docker-compose.yml` — db (postgres:17-alpine, pgdata volume), redis (redis:7-alpine), api (dev target); todo-net bridge network; health checks; depends_on service_healthy

### CI/CD
- `.github/workflows/ci.yml` — 4 jobs: lint + type-check (parallel) → test (live PG 17 + Redis 7 services, BCRYPT_ROUNDS=4) → docker (build + push to GHCR on main, GITHUB_TOKEN auth)

### Tests
- `tests/helpers/build-app.ts` — buildTestApp() helper using fastify.inject() pattern
- `tests/unit/config.test.ts` — env.ts validation and defaults
- `tests/unit/errors.test.ts` — all 6 domain error classes (statusCode, message, name)
- `tests/integration/health.test.ts` — GET /health returns 200 with mocked Prisma + Redis
- `tests/property/.gitkeep` — placeholder; PBT tests added in UNIT-02

## Stub Files to Complete
| File | Completed in |
|---|---|
| auth.routes.ts, auth.controller.ts, auth.service.ts, user.service.ts, token.service.ts, user.repository.ts | UNIT-02 |
| tasks.routes.ts, categories.routes.ts, tasks.controller.ts, categories.controller.ts, task.service.ts, category.service.ts, task.repository.ts, category.repository.ts, task-category.repository.ts | UNIT-04 |

## First-Time Setup Commands
```bash
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD and JWT_SECRET (min 32 chars)
docker compose up --build
# In a second terminal, after containers are healthy:
docker compose exec api npx prisma migrate dev --name init
```
