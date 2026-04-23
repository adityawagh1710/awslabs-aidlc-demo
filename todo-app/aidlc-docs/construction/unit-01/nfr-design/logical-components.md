# Logical Components — UNIT-01: DB & Infrastructure Foundation

Defines every logical infrastructure component created in UNIT-01, its responsibility, its
interface, and how it connects to other components. Code Generation maps each component to a
concrete file path.

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│  src/server.ts  (entry point)                                   │
│   Fail-Fast: env validate → DB ping → Redis ping → listen()    │
│   Graceful shutdown: SIGTERM → fastify.close → prisma → redis  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ creates
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/app.ts  (Fastify app factory)                              │
│   Registers plugins in order (see Pattern 7)                    │
│   Returns configured FastifyInstance                            │
└────┬──────────────┬──────────────┬──────────────┬──────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
 config/env.ts  plugins/      plugins/        routes/
 (zod)          logger.ts     auth.ts         *.routes.ts
                redis.ts      error-handler
                security.ts
```

---

## Component Definitions

### `src/config/env.ts` — Environment Configuration
| Attribute | Detail |
|---|---|
| **Responsibility** | Parse and validate `process.env` via zod schema at import time |
| **Exports** | `env` object (typed, all vars guaranteed present and valid) |
| **Failure mode** | Throws `ZodError` → caught in server.ts → `process.exit(1)` |
| **Consumed by** | `server.ts`, all plugins that need env values |

Key env vars validated: `NODE_ENV`, `PORT`, `DATABASE_URL`, `DATABASE_URL_TEST`, `REDIS_URL`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE`, `CORS_ORIGIN` (prod only),
`LOG_LEVEL`, `BCRYPT_ROUNDS`.

---

### `src/plugins/logger.ts` — Structured Logger
| Attribute | Detail |
|---|---|
| **Responsibility** | Create pino logger instance; configure pino-pretty transport in development |
| **Exports** | `loggerOptions: FastifyServerOptions['logger']` |
| **Development** | `pino-pretty` transport with coloured output |
| **Production** | Raw JSON to stdout; `redact` strips sensitive fields |
| **Consumed by** | `app.ts` (passed to `Fastify({ logger: loggerOptions })`) |

Redacted paths: `req.headers.authorization`, `body.password`, `body.token`, `*.password`, `*.token`.

---

### `src/plugins/redis.ts` — Redis Client Plugin
| Attribute | Detail |
|---|---|
| **Responsibility** | Create ioredis client; decorate Fastify instance with `fastify.redis`; register `onClose` hook to call `redis.quit()` |
| **Exports** | Fastify plugin (via `fastify-plugin` wrapper to share decoration across encapsulation scopes) |
| **Connection** | Connects to `env.REDIS_URL`; `retryStrategy` with exponential back-off capped at 3 s |
| **Fail-closed** | Auth plugin reads `fastify.redis.status`; throws 503 if not `'ready'` |
| **Consumed by** | `auth.ts` (blacklist checks), `health` route (ping check) |

---

### `src/plugins/security.ts` — Security Headers + CORS + Rate Limit
| Attribute | Detail |
|---|---|
| **Responsibility** | Register `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` with correct config |
| **Helmet** | Defaults enabled; CSP disabled (API only); HSTS enabled in production |
| **CORS** | Development: `origin: "*"`; Production: `origin: env.CORS_ORIGIN` |
| **Rate limit** | Global: 200 req / 15 min per IP; Auth routes override to 10 req / 15 min (set in UNIT-02) |
| **Consumed by** | `app.ts` |

---

### `src/plugins/auth.ts` — JWT Auth Plugin (Scaffold)
| Attribute | Detail |
|---|---|
| **Responsibility** | Register `@fastify/jwt` with secret + options; expose `fastify.authenticate` preHandler |
| **UNIT-01 scope** | Plugin registration + `authenticate` preHandler scaffold only — no routes use it yet |
| **UNIT-02 scope** | `authenticate` is wired to protected routes; blacklist check added |
| **preHandler logic** | Verify JWT signature → check Redis blacklist (fail-closed) → set `request.user` |
| **Consumed by** | All protected route handlers (UNIT-02 onwards) |

---

### `src/plugins/error-handler.ts` — Global Error Handler
| Attribute | Detail |
|---|---|
| **Responsibility** | `fastify.setErrorHandler` — normalise all errors to `{ error: string, message: string }` shape |
| **Production** | Stack traces stripped from response; logged internally at ERROR level |
| **Development** | Stack traces included in response for easier debugging |
| **Maps** | `ZodError` → 400, `@fastify/sensible` httpErrors → their status, unhandled → 500 |
| **Consumed by** | All routes (automatic — Fastify routes errors here) |

---

### `src/app.ts` — Fastify App Factory
| Attribute | Detail |
|---|---|
| **Responsibility** | Create and configure the Fastify instance; register all plugins and routes in order |
| **Returns** | `FastifyInstance` (ready to call `.listen()`) |
| **Does not** | Call `.listen()` — that is `server.ts`'s job (enables `fastify.inject()` in tests) |
| **Plugin order** | See Pattern 7 in nfr-design-patterns.md |

---

### `src/server.ts` — Entry Point
| Attribute | Detail |
|---|---|
| **Responsibility** | Fail-fast startup validation; call `app.ts`; call `fastify.listen()`; register SIGTERM/SIGINT handlers |
| **Startup sequence** | env validate → DB ping → Redis ping → `app()` → `listen()` |
| **Shutdown sequence** | `fastify.close()` → `prisma.$disconnect()` → `redis.quit()` → `process.exit(0)` |
| **Shutdown timeout** | 10 s hard kill via `setTimeout(() => process.exit(1), 10_000)` |

---

### `src/routes/health.ts` — Health Check Route
| Attribute | Detail |
|---|---|
| **Endpoint** | `GET /health` |
| **Auth required** | No |
| **Response 200** | `{ status: "ok", timestamp: "<ISO>", checks: { database: "ok", redis: "ok" } }` |
| **Response 503** | `{ status: "degraded", timestamp: "<ISO>", checks: { database: "ok\|error", redis: "ok\|error" } }` |
| **DB check** | `prisma.$queryRaw\`SELECT 1\`` with 2 s timeout |
| **Redis check** | `redis.ping()` with 2 s timeout |

---

### `src/domain/errors.ts` — Domain Error Classes
| Attribute | Detail |
|---|---|
| **Responsibility** | Typed error classes for all domain failures |
| **Classes** | `NotFoundError`, `ForbiddenError`, `ConflictError`, `UnauthorizedError`, `ValidationError`, `ServiceUnavailableError` |
| **Consumed by** | Services (UNIT-02+), error-handler plugin |

---

### `src/types/fastify.d.ts` — TypeScript Augmentation
| Attribute | Detail |
|---|---|
| **Responsibility** | Augment `FastifyRequest` with `user: TokenPayload` (set by auth preHandler) |
| **Augments** | `FastifyInstance` with `redis: Redis` and `authenticate: preHandlerHook` |
| **Consumed by** | All TypeScript files that read `request.user` or `fastify.redis` |

---

### `prisma/schema.prisma` — Database Schema
Tables defined in UNIT-01 (no `token_blacklist` — replaced by Redis):

| Model | Key fields |
|---|---|
| `User` | `id` (cuid), `email` (unique), `passwordHash`, `createdAt`, `updatedAt` |
| `Task` | `id`, `userId` (FK), `title`, `description`, `status`, `priority`, `dueDate`, `completedAt`, `createdAt`, `updatedAt` |
| `Category` | `id`, `userId` (FK), `name`, `colour`, `createdAt`, `updatedAt` |
| `TaskCategory` | `taskId` (FK) + `categoryId` (FK) — composite PK |

Indexes added in UNIT-01 migration:
- `User.email` (unique index — already implicit)
- `Task(userId)` — all task queries filter by owner
- `Task(userId, dueDate)` — overdue queries
- `Category(userId)` — category list by owner
- `TaskCategory(taskId)`, `TaskCategory(categoryId)` — join traversal

Additional search/filter indexes (added in UNIT-06 migration):
- `Task(userId, priority)`, `Task(userId, status)`, `Task(userId, completedAt)`

---

## Infrastructure Services (Docker Compose)

| Service | Image | Port (host) | Health check |
|---|---|---|---|
| `db` | `postgres:17-alpine` | 5432 | `pg_isready -U todo_app -d todo` |
| `redis` | `redis:7-alpine` | 6379 | `redis-cli ping` |
| `api` | local Dockerfile (dev target) | 3000 | `GET /health` |

`api` service has `depends_on: { db: { condition: service_healthy }, redis: { condition: service_healthy } }`.
