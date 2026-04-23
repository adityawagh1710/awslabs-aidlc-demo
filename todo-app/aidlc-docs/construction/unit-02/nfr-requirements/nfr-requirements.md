# NFR Requirements — UNIT-02: Backend Auth & User Management

All UNIT-01 decisions (Node 22, PostgreSQL 17, Redis 7, Vitest, bcryptjs, GitHub Actions, port 3000)
are inherited unchanged. This document covers auth-specific NFRs only.

---

## Performance Requirements

| Requirement | Target | Notes |
|---|---|---|
| Login p95 latency | < 500 ms | bcryptjs at 12 rounds ≈ 250 ms CPU; 250 ms budget for DB + Redis ops |
| Register p95 latency | < 600 ms | bcryptjs hashing + DB write |
| Refresh p95 latency | < 100 ms | Redis lookup + JWT verify + JWT sign — no bcrypt |
| Logout p95 latency | < 50 ms | Redis write only |
| Auth middleware overhead | < 10 ms | JWT verify is in-process; Redis EXISTS is a single round trip |

**bcrypt performance note**: At `BCRYPT_ROUNDS=12`, a single hash takes ~250 ms on commodity
hardware. This is intentional (makes brute-force computationally expensive) and fits within the
500 ms p95 budget. Do not lower rounds below 10 in production.

---

## Security Requirements

| Rule | UNIT-02 Implementation |
|---|---|
| SECURITY-07 IDOR | `request.user.sub` always used as `userId`; body `userId` field forbidden on all auth routes |
| SECURITY-11 Credentials | Passwords never logged; generic error messages for failed auth; constant-time comparison via `bcrypt.compare` even when user not found |
| SECURITY-02 Audit logging | All auth events logged: `register`, `login.success`, `login.failure`, `login.locked`, `logout`, `refresh.success`, `refresh.failure` with `{ event, email, userId?, ip, userAgent, success }` |
| SECURITY-13 Alerting | Failed login attempts logged at `warn`; account lockout logged at `warn` with email (hashed for privacy in prod) |
| SECURITY-14 Exception handling | All auth errors return generic shape `{ error, message }`; no stack traces in production |

---

## Reliability Requirements

| Requirement | Detail |
|---|---|
| Brute-force protection | 10 req/15 min per IP on auth routes (override global 200/15 min); per-email lockout after 5 failures, 15 min TTL |
| Concurrent sessions | Unlimited — each device gets its own refresh token; all sessions independent |
| Refresh token TTL | Fixed 7 days from issuance; no sliding window |
| Blacklist on logout | Access token blacklisted for its remaining lifetime; refresh token deleted from Redis |
| Failure isolation | Redis unavailability → 503 on authenticated routes (fail-closed); registration/login do not require Redis (only blacklist check does) |

---

## Auth Event Logging Schema

Every auth event emitted via `fastify.log` with these fields:

```typescript
interface AuthEvent {
  event:     'register' | 'login.success' | 'login.failure' | 'login.locked'
           | 'logout' | 'refresh.success' | 'refresh.failure'
  email:     string        // normalised; redacted field list in pino does NOT redact this
  userId?:   string        // present on success events only
  ip:        string        // request.ip
  userAgent: string        // request.headers['user-agent'] ?? 'unknown'
  success:   boolean
}
```

Log levels:
- `info` — `register`, `login.success`, `logout`, `refresh.success`
- `warn` — `login.failure`, `login.locked`, `refresh.failure`
