# Code Generation Plan — UNIT-01: DB & Infrastructure Foundation

## Unit Context
- **Repository**: `todo-backend/` (at workspace root `/home/adityawagh/awslabs-aidlc-demo/todo-backend/`)
- **Type**: Infrastructure (greenfield multi-unit → `todo-backend/` directory)
- **Stories implemented**: None directly — enables UNIT-02 through UNIT-06
- **Dependencies**: None (root unit)
- **Deliverable**: Running `docker compose up --build` starts PostgreSQL + Redis + Fastify; `GET /health` returns 200; Prisma schema migrates clean; TypeScript compiles; lint passes

## Stories Implemented
None (infrastructure unit). All 18 user stories are enabled by this scaffold.

## Step Sequence

---

### PART A — Project Skeleton

**Step 1** — Create `todo-backend/` directory and `package.json`
- [x] Create `todo-backend/package.json` with all runtime + dev dependencies and all npm scripts
- Runtime deps: `fastify`, `@fastify/jwt`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/sensible`, `fastify-plugin`, `@prisma/client`, `ioredis`, `bcryptjs`, `pino`, `zod`
- Dev deps: `typescript`, `tsx`, `@types/node`, `@types/bcryptjs`, `prisma`, `vitest`, `@vitest/coverage-v8`, `fast-check`, `pino-pretty`, `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-import`, `prettier`
- Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `type-check`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`, `db:migrate`, `db:migrate:deploy`, `db:studio`

**Step 2** — TypeScript configuration
- [x] Create `todo-backend/tsconfig.json` (strict mode, `moduleResolution: bundler`, `module: ESNext`, `target: ES2022`, `outDir: dist`, paths for `src/`)
- [x] Create `todo-backend/tsconfig.build.json` (extends tsconfig.json, excludes `tests/`)

**Step 3** — ESLint configuration
- [x] Create `todo-backend/eslint.config.ts` (flat config, `@typescript-eslint/recommended`, `import/order` rule)

**Step 4** — Prettier and ignore files
- [x] Create `todo-backend/.prettierrc` (semi: true, singleQuote: true, printWidth: 100, trailingComma: all)
- [x] Create `todo-backend/.prettierignore`
- [x] Create `todo-backend/.gitignore` (node_modules, dist, .env, data/, coverage/)

**Step 5** — Vitest configuration
- [x] Create `todo-backend/vitest.config.ts` (testEnvironment: node, coverage provider: v8, include: `tests/**/*.test.ts`)

**Step 6** — Tooling files
- [x] Create `todo-backend/.nvmrc` (content: `22`)
- [x] Create `todo-backend/.env.example` (all 13 env vars with placeholder values)
- [x] Create `todo-backend/.dockerignore`

---

### PART B — Source Code: Config & Domain

**Step 7** — Environment configuration
- [x] Create `todo-backend/src/config/env.ts` — zod schema validating all env vars; exports typed `env` object; throws with human-readable message on failure

**Step 8** — Domain error classes
- [x] Create `todo-backend/src/domain/errors.ts` — `NotFoundError`, `ForbiddenError`, `ConflictError`, `UnauthorizedError`, `ValidationError`, `ServiceUnavailableError` (all extend `Error` with `statusCode` property)

**Step 9** — TypeScript augmentation
- [x] Create `todo-backend/src/types/fastify.d.ts` — augment `FastifyRequest` with `user: TokenPayload`; augment `FastifyInstance` with `redis: Redis` and `authenticate: preHandlerHookHandler`

---

### PART C — Fastify Plugins

**Step 10** — Logger plugin
- [x] Create `todo-backend/src/plugins/logger.ts` — pino options: pino-pretty transport when `NODE_ENV === 'development'`; raw JSON in production; redact sensitive fields

**Step 11** — Redis plugin
- [x] Create `todo-backend/src/plugins/redis.ts` — ioredis client factory; exponential backoff retry strategy; `fastify.decorate('redis', client)`; `onClose` hook calls `redis.quit()`; wrapped with `fastify-plugin`

**Step 12** — Security plugin
- [x] Create `todo-backend/src/plugins/security.ts` — registers `@fastify/helmet`, `@fastify/cors` (dev: `*`, prod: `env.CORS_ORIGIN`), `@fastify/rate-limit` (200 req/15 min global)

**Step 13** — Auth plugin scaffold
- [x] Create `todo-backend/src/plugins/auth.ts` — registers `@fastify/jwt`; defines `authenticate` preHandler (JWT verify + fail-closed Redis blacklist check + sets `request.user`); `fastify.decorate('authenticate', ...)`

**Step 14** — Error handler plugin
- [x] Create `todo-backend/src/plugins/error-handler.ts` — `fastify.setErrorHandler`; maps domain errors to HTTP status codes; strips stack traces in production; logs at ERROR level

---

### PART D — Routes, Stubs & App Assembly

**Step 15** — Health route
- [x] Create `todo-backend/src/routes/health.ts` — `GET /health`; runs `prisma.$queryRaw` + `redis.ping()` with 2 s timeout; returns `{ status, timestamp, checks }` with 200 or 503

**Step 16** — Route stubs (implemented in UNIT-02 and UNIT-04)
- [x] Create `todo-backend/src/routes/auth.routes.ts` — stub: empty Fastify plugin, TODO comment
- [x] Create `todo-backend/src/routes/tasks.routes.ts` — stub
- [x] Create `todo-backend/src/routes/categories.routes.ts` — stub

**Step 17** — Controller stubs
- [x] Create `todo-backend/src/controllers/auth.controller.ts` — stub class/functions with TODO
- [x] Create `todo-backend/src/controllers/tasks.controller.ts` — stub
- [x] Create `todo-backend/src/controllers/categories.controller.ts` — stub

**Step 18** — Service stubs
- [x] Create `todo-backend/src/services/auth.service.ts` — stub
- [x] Create `todo-backend/src/services/task.service.ts` — stub
- [x] Create `todo-backend/src/services/category.service.ts` — stub
- [x] Create `todo-backend/src/services/user.service.ts` — stub
- [x] Create `todo-backend/src/services/token.service.ts` — stub

**Step 19** — Repository stubs
- [x] Create `todo-backend/src/repositories/user.repository.ts` — stub
- [x] Create `todo-backend/src/repositories/task.repository.ts` — stub
- [x] Create `todo-backend/src/repositories/category.repository.ts` — stub
- [x] Create `todo-backend/src/repositories/task-category.repository.ts` — stub
- [x] Create `todo-backend/src/repositories/token-blacklist.repository.ts` — stub (uses Redis, not Prisma)

**Step 20** — App factory
- [x] Create `todo-backend/src/app.ts` — Fastify instance creation; register all plugins in the defined order (Steps 10–14); register routes (Steps 15–16); export `buildApp()` function

**Step 21** — Server entry point
- [x] Create `todo-backend/src/server.ts` — fail-fast env validation; DB + Redis connectivity checks; `buildApp()` + `fastify.listen()`; SIGTERM/SIGINT graceful shutdown with 10 s hard-kill timeout

---

### PART E — Database

**Step 22** — Prisma schema
- [x] Create `todo-backend/prisma/schema.prisma` — datasource (postgresql), generator (client), 4 models: `User`, `Task`, `Category`, `TaskCategory`; all indexes; no `token_blacklist` model

**Step 23** — Document migration approach
- [x] Create `todo-backend/aidlc-docs/construction/unit-01/code/migration-note.md` (note: `prisma migrate dev --name init` run locally after `docker compose up`)

---

### PART F — Infrastructure Files

**Step 24** — Dockerfile
- [x] Create `todo-backend/Dockerfile` — 4-stage: base, development, builder, production (non-root user)

**Step 25** — Docker Compose
- [x] Create `todo-backend/docker-compose.yml` — db, redis, api services; `todo-net` bridge network; named `pgdata` volume; health checks; `depends_on` with `service_healthy`

---

### PART G — CI Pipeline

**Step 26** — GitHub Actions workflow
- [x] Create `todo-backend/.github/workflows/ci.yml` — 4 separate jobs: lint, type-check (parallel), test (with live PG + Redis services), docker (build + push to GHCR on main)

---

### PART H — Tests

**Step 27** — Test setup helpers
- [x] Create `todo-backend/tests/helpers/build-app.ts` — `buildTestApp()` helper using `fastify.inject()` pattern; sets up test env vars

**Step 28** — Unit tests
- [x] Create `todo-backend/tests/unit/config.test.ts` — tests that `env.ts` throws on missing vars; parses valid env correctly
- [x] Create `todo-backend/tests/unit/errors.test.ts` — tests each domain error class has correct `statusCode` and `message`

**Step 29** — Integration test
- [x] Create `todo-backend/tests/integration/health.test.ts` — tests `GET /health` returns 200 with `{ status: "ok" }` (uses `fastify.inject()`, mocks Redis ping and Prisma query)

**Step 30** — PBT placeholder
- [x] Create `todo-backend/tests/property/.gitkeep` — PBT tests added in UNIT-02 (JWT round-trip, password hash properties)

---

### PART I — Documentation

**Step 31** — Code generation summary
- [x] Create `aidlc-docs/construction/unit-01/code/summary.md` — lists all created files with one-line descriptions; notes stub files to be completed in downstream units
