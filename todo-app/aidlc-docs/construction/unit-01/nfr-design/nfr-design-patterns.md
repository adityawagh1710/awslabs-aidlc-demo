# NFR Design Patterns — UNIT-01: DB & Infrastructure Foundation

All patterns defined here are implemented in UNIT-01 Code Generation and inherited by every
downstream unit. Changes require updating this file and re-reviewing affected units.

---

## 1. Fail-Fast Startup Pattern

**Applies to**: `src/server.ts` (entry point)

On process start, before Fastify begins accepting connections:
1. Validate all required environment variables via the `zod` schema in `src/config/env.ts`.
   Process exits with code 1 and a clear error message if any required var is missing or invalid.
2. Test PostgreSQL connectivity via `prisma.$queryRaw\`SELECT 1\``.
3. Test Redis connectivity via `redis.ping()`.

If either step 2 or 3 throws, the process exits with code 1. Docker Compose
`depends_on: condition: service_healthy` and a `restart: on-failure` policy handle retries.
No partial-init state is ever exposed.

```
process start
    │
    ▼
validate env (zod) ──FAIL──► exit(1)
    │
    ▼
prisma.$queryRaw ────FAIL──► exit(1)
    │
    ▼
redis.ping() ────────FAIL──► exit(1)
    │
    ▼
fastify.listen() — server accepts requests
```

---

## 2. Fail-Closed Redis Pattern

**Applies to**: `src/plugins/auth.ts` (JWT preHandler)

Every authenticated request checks `redis.exists('blacklist:{jti}')`. If the Redis client is in a
disconnected/error state when the check is attempted:

- The preHandler **throws a 503** (`ServiceUnavailableError` from `@fastify/sensible`).
- The error is logged at `ERROR` level with `{ reason: 'redis_unavailable', jti }`.
- The global error handler maps this to `{ error: "ServiceUnavailable", message: "..." }`.

A logged-out token is **never** treated as valid during a Redis outage. This aligns with
SECURITY-11 (credential management) — prefer availability loss over security loss.

```
authenticated request
    │
    ▼
JWT verify (in-process, no Redis needed)
    │
    ▼
redis.exists('blacklist:{jti}')
    ├── Redis healthy → result 0/1 → allow/reject
    └── Redis error   → throw 503 (fail-closed)
```

---

## 3. Deep Health Check Pattern

**Applies to**: `GET /health` route

Returns `200 OK` only when **both** dependencies are reachable:

```typescript
{
  "status": "ok" | "degraded",
  "timestamp": "<ISO-8601>",
  "checks": {
    "database": "ok" | "error",
    "redis":    "ok" | "error"
  }
}
```

- `status: "ok"` → all checks pass → HTTP 200
- `status: "degraded"` → any check fails → HTTP 503

Docker `HEALTHCHECK` and future load balancer probes use this endpoint. The route runs
`prisma.$queryRaw\`SELECT 1\`` and `redis.ping()` with a **2-second timeout** each; slow responses
are treated as failures.

---

## 4. Graceful Shutdown Pattern

**Applies to**: `src/server.ts`

SIGTERM / SIGINT handler:
```
receive SIGTERM/SIGINT
    │
    ▼
fastify.close()          ← stops accepting new connections, drains in-flight requests
    │
    ▼
prisma.$disconnect()     ← closes PostgreSQL connection pool
    │
    ▼
redis.quit()             ← sends QUIT to Redis, waits for ACK
    │
    ▼
process.exit(0)
```

Timeout: if drain takes longer than **10 seconds**, `process.exit(1)` is forced.

---

## 5. Structured Logging Pattern

**Applies to**: `src/plugins/logger.ts` + every log call site

- **Production**: raw pino JSON to stdout — consumed by log aggregators (CloudWatch, Datadog, etc.)
- **Development**: `pino-pretty` transport — coloured, human-readable terminal output

Request lifecycle fields logged on every response:
```
requestId, method, url, statusCode, responseTime (ms), userId (when authenticated)
```

Sensitive fields **never** logged: `password`, `token`, `authorization` header values, cookie values.
Pino `redact` option strips these paths automatically.

pino `redact` paths:
```
['req.headers.authorization', 'body.password', 'body.token', '*.password', '*.token']
```

---

## 6. Environment Validation Pattern

**Applies to**: `src/config/env.ts`

Zod schema validates and parses `process.env` at module load time. All other modules import from
`env.ts` — they never read `process.env` directly.

```typescript
// Usage pattern across the codebase
import { env } from '../config/env.js'
env.DATABASE_URL   // typed, validated string — never undefined
env.JWT_SECRET     // typed, validated string — never undefined
```

If any required var is missing or fails validation, `env.ts` throws a `ZodError` caught in
`server.ts`, which prints a human-readable summary and exits with code 1.

---

## 7. Plugin Registration Order Pattern

**Applies to**: `src/app.ts`

Fastify plugins are registered in dependency order. Plugins that `decorate` the instance must be
registered before plugins that consume the decoration.

```
1. logger plugin          (no dependencies)
2. @fastify/sensible      (adds httpErrors helpers — used by all subsequent plugins)
3. @fastify/helmet        (security headers — must run before any route handler)
4. @fastify/cors          (CORS — must run before routes)
5. @fastify/rate-limit    (rate limiting — before auth routes)
6. error-handler plugin   (global setErrorHandler — before routes)
7. auth plugin            (decorates request.user — before protected routes)
8. routes                 (auth.routes, tasks.routes, categories.routes)
9. /health route          (always last — confirms all plugins loaded)
```

---

## 8. Security Headers Pattern

**Applies to**: `@fastify/helmet` in `src/app.ts`

Helmet defaults enabled plus:
- `contentSecurityPolicy`: disabled for API-only server (no HTML served)
- `crossOriginResourcePolicy`: `{ policy: "cross-origin" }` — permits browser fetch from frontend
- `hsts`: `{ maxAge: 31536000 }` in production; disabled in development (no TLS locally)

CORS:
- Development: `origin: "*"`, `credentials: false`
- Production: `origin: env.CORS_ORIGIN`, `credentials: true`

---

## 9. Redis Reconnect Pattern

**Applies to**: `src/plugins/redis.ts` (ioredis client factory)

ioredis reconnect strategy:
```typescript
retryStrategy: (times) => Math.min(times * 100, 3000)  // back-off capped at 3 s
```

Maximum reconnect attempts: unlimited during steady state (ioredis default). The fail-closed
pattern (Pattern 2) handles the in-flight request impact during outages.

The ioredis client instance is attached to the Fastify instance via `fastify.decorate('redis', client)`
so all plugins and route handlers access the same singleton.
