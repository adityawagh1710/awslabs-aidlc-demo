# Tech Stack Decisions — UNIT-02: Backend Auth & User Management

## Inherited from UNIT-01 (unchanged)
Node 22 LTS, TypeScript 5.7, PostgreSQL 17, Redis 7, Fastify 5, Prisma 6, ioredis 5,
bcryptjs 2 (rounds 12), Vitest 2, fast-check 3, ESLint 9, Prettier 3, GitHub Actions.

---

## UNIT-02 Additions

| Decision | Choice | Rationale |
|---|---|---|
| **Concurrent sessions** | Unlimited | Multi-device UX (Jordan persona); each login independently scoped refresh token |
| **Refresh token TTL** | Fixed 7 days | Simpler; users re-authenticate weekly; no indefinite session risk |
| **Auth event logging** | Structured pino fields (info/warn) | SECURITY-02 compliance; enables security monitoring without custom audit store |
| **Auth route rate limit** | 10 req / 15 min per IP | Applied via `@fastify/rate-limit` `config` option on auth route prefix |
| **Lockout storage** | Redis `lockout:{email}` key, TTL 900 s | Auto-expiry; no cleanup job; consistent with blacklist pattern |
| **Failure counter** | Redis `attempts:{email}` INCR, TTL 900 s | Atomic increment; TTL resets window on first failure |
| **Constant-time login** | `bcrypt.compare` always runs | Even when `findByEmail` returns null, compare against a dummy hash to prevent timing attacks |
| **Refresh token rotation** | Strict — old token deleted on each use | Prevents refresh token replay; if stolen token used first, victim's next use fails → detected |

## No New Infrastructure
UNIT-02 adds no new services to Docker Compose. All auth state (blacklist, lockout, refresh
tokens, failure counters) uses the Redis instance defined in UNIT-01.
