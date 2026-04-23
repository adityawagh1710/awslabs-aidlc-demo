# Tech Stack Decisions — UNIT-01: DB & Infrastructure Foundation

All decisions apply to `todo-backend` unless noted. Downstream units MUST NOT override these
choices without updating this file.

---

## Runtime

| Decision | Choice | Rationale |
|---|---|---|
| **Node.js version** | 22 LTS "Jod" | Active LTS until April 2027; Node 20 reaches EOL 2026-04-30 (8 days from project start). Pin in `.nvmrc`, `Dockerfile`, and CI matrix. |
| **Package manager** | npm (lockfile: `package-lock.json`) | Default; `npm ci` in Docker and CI ensures reproducible installs |
| **TypeScript version** | 5.7 (latest stable) | Strict mode enabled; `moduleResolution: "bundler"` |

## Database

| Decision | Choice | Rationale |
|---|---|---|
| **RDBMS** | PostgreSQL 17 | Latest stable; improved vacuuming, logical replication, `MERGE` syntax |
| **ORM** | Prisma 6.x | Type-safe queries, migration tooling, schema-first |
| **Local PostgreSQL** | Docker Compose service (`postgres:17-alpine`) | Alpine image minimises layer size |
| **DB user** | `todo_app` (non-superuser) | Principle of least privilege (SECURITY-05) |
| **Token blacklist** | **Redis** (`ioredis` client) | TTL-based auto-expiry requires no purge job; better throughput than a polling `DELETE WHERE expiresAt < NOW()`. `token_blacklist` Prisma model is **removed** from schema. |

### Schema Impact (Redis choice)
The `token_blacklist` table originally planned in Prisma schema is **not created**.
`TokenBlacklistRepository` is implemented using `ioredis`:
```typescript
// Key pattern: `blacklist:${jti}` — TTL set to token remaining lifetime
await redis.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds)
await redis.exists(`blacklist:${jti}`)  // → 1 | 0
```

## Caching / Token Blacklist

| Decision | Choice | Rationale |
|---|---|---|
| **Redis client** | `ioredis` 5.x | TypeScript-first, well-maintained, reconnect strategies built-in |
| **Local Redis** | Docker Compose service (`redis:7-alpine`) | Alpine image; no persistence needed in dev (blacklist resets on restart) |
| **Redis port** | 6379 (default) | Exposed to host in development only |

## Web Framework

| Decision | Choice | Rationale |
|---|---|---|
| **HTTP framework** | Fastify 5.x | Chosen in Application Design (Q4-B); schema-based validation, plugin architecture, pino built-in |
| **API port** | 3000 | Standard Fastify default |
| **Key Fastify plugins** | `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/sensible`, `@fastify/jwt` | All registered in UNIT-01 scaffold; configured in downstream units |

## Security Libraries

| Decision | Choice | Rationale |
|---|---|---|
| **Password hashing** | `bcryptjs` 2.x (pure JS) | Simpler Docker build (no native bindings); widely audited; cost factor 12 |
| **Input validation** | Fastify JSON schema (AJV under the hood) + `zod` for env config | AJV at route level; zod for startup-time env validation |
| **CORS (dev)** | `origin: "*"` | Convenience during local development only |
| **CORS (prod)** | `origin: process.env.CORS_ORIGIN` | Must be set explicitly; no wildcard in production |
| **HTTP headers** | `@fastify/helmet` defaults | Includes `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, CSP |

## Testing

| Decision | Choice | Rationale |
|---|---|---|
| **Test runner** | Vitest 2.x | Zero-transform TypeScript, faster watch mode, consistent with `todo-frontend` conventions |
| **PBT framework** | `fast-check` 3.x | Required by PBT extension (PBT-01); integrates with Vitest |
| **HTTP integration tests** | `fastify.inject()` | No real HTTP port needed; avoids port conflicts in CI |
| **Test database** | Separate `todo_test` DB on same PostgreSQL instance | Isolated from dev data; cleaned between test runs via Prisma `$executeRaw` truncate |

## CI/CD

| Decision | Choice | Rationale |
|---|---|---|
| **CI platform** | GitHub Actions | Chosen (Q5-A); free for public repos, native Docker support |
| **CI workflow file** | `.github/workflows/ci.yml` | Single workflow: lint → type-check → test → build |
| **Node.js setup** | `actions/setup-node@v4` with `cache: 'npm'` | Caches `~/.npm` between runs |
| **Docker build in CI** | `docker build --target production .` | Validates production Dockerfile on every PR |

## Code Quality

| Decision | Choice | Rationale |
|---|---|---|
| **Linter** | ESLint 9.x (flat config `eslint.config.ts`) | Latest flat config format; `@typescript-eslint/recommended` |
| **Formatter** | Prettier 3.x | `.prettierrc` committed; `prettier --check` in CI |
| **Import ordering** | `eslint-plugin-import` | Enforces consistent import groups |

## Environment Configuration

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` / `production` / `test` |
| `PORT` | No (default 3000) | API server port |
| `DATABASE_URL` | Yes | Prisma connection string (PostgreSQL) |
| `DATABASE_URL_TEST` | Yes (test env) | Separate PostgreSQL DB for tests |
| `REDIS_URL` | Yes | ioredis connection string (`redis://localhost:6379`) |
| `JWT_SECRET` | Yes | Minimum 32 characters; used by `@fastify/jwt` |
| `JWT_EXPIRES_IN` | No (default `15m`) | Token lifetime (e.g., `15m`, `1h`) |
| `JWT_ISSUER` | No (default `todo-api`) | JWT `iss` claim |
| `JWT_AUDIENCE` | No (default `todo-client`) | JWT `aud` claim |
| `CORS_ORIGIN` | Yes (production) | Allowed origin for `@fastify/cors` |
| `LOG_LEVEL` | No (default `info`) | pino log level |
| `BCRYPT_ROUNDS` | No (default `12`) | bcryptjs work factor |

---

## Version Pinning Summary

```
Node.js      22 LTS
PostgreSQL   17
Redis        7
TypeScript   5.7
Fastify      5.x
Prisma       6.x
ioredis      5.x
bcryptjs     2.x
Vitest       2.x
fast-check   3.x
ESLint       9.x
Prettier     3.x
```
