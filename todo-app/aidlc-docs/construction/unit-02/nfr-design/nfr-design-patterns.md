# NFR Design Patterns — UNIT-02: Backend Auth & User Management

All UNIT-01 patterns (fail-fast startup, fail-closed Redis, graceful shutdown, structured logging,
plugin registration order, security headers, Redis reconnect) are inherited. This document adds
auth-specific patterns only.

---

## Pattern 10 — Constant-Time Login

**Applies to**: `AuthService.login()`

To prevent timing-based email enumeration, the password comparison step always executes at the
same computational cost regardless of whether the user exists:

```
findByEmail(email) → null?
    │
    ├── User NOT found:
    │     bcrypt.compare(password, DUMMY_HASH)  // always runs — discards result
    │     throw UnauthorizedError("Invalid credentials")
    │
    └── User found:
          bcrypt.compare(password, user.passwordHash)
          └── false → record failure → throw UnauthorizedError("Invalid credentials")
          └── true  → reset counter → continue
```

`DUMMY_HASH` is a module-level constant generated once at startup:
```typescript
const DUMMY_HASH = await bcrypt.hash('dummy', env.BCRYPT_ROUNDS)
```

---

## Pattern 11 — Brute-Force Protection (Counter + Lockout)

**Applies to**: `BruteForceService`

Two Redis keys cooperate to enforce the lockout policy:

```
Login attempt for email E
    │
    ▼
GET lockout:{E} ──── exists ──► 401 "Account temporarily locked"
    │
    │ (not locked)
    ▼
[credential verification]
    │
    ├── SUCCESS:
    │     DEL attempts:{E}
    │
    └── FAILURE:
          INCR attempts:{E}
          ├── First failure: EXPIRE attempts:{E} 900
          └── Counter ≥ 5:
                SET lockout:{E} 1 EX 900
                DEL attempts:{E}
                log.warn { event: 'login.locked', email }
```

Both keys carry a 15-minute TTL — no background cleanup job needed.

---

## Pattern 12 — Refresh Token Rotation

**Applies to**: `TokenService` + `AuthService.refresh()`

Strict rotation: the old refresh token is atomically deleted before the new one is issued.
If an attacker reuses a rotated token, the key is already gone → 401, victim detects theft
on next refresh attempt.

```
POST /api/v1/auth/refresh { refreshToken }
    │
    ▼
verify JWT signature + exp
    │
    ▼
GET refresh:{oldJti} from Redis
    └── missing → 401 "Token has been revoked"
    │
    ▼
DEL refresh:{oldJti}          ← rotation: old token gone before new one exists
    │
    ▼
signPair(userId) → { accessToken, refreshToken }
    │
    ▼
SET refresh:{newJti} {userId} EX 604800
    │
    ▼
return { accessToken, refreshToken, user }
```

---

## Pattern 13 — Auth Event Emission

**Applies to**: All `AuthService` methods

Auth events are emitted inline at the point of outcome (not via an event emitter) using the
Fastify logger passed into the service constructor.

```typescript
// Success:
this.log.info({ event: 'login.success', email, userId, ip, userAgent, success: true })

// Failure:
this.log.warn({ event: 'login.failure', email, ip, userAgent, success: false })

// Lockout:
this.log.warn({ event: 'login.locked', email, ip, userAgent, success: false })
```

`ip` is extracted from `request.ip` (Fastify `trustProxy: true` resolves `X-Forwarded-For`).
`userAgent` is `request.headers['user-agent'] ?? 'unknown'`.

Both `ip` and `userAgent` are passed from the controller into the service method as part of the
`context` parameter — the service layer never accesses the Fastify request directly.

---

## Pattern 14 — IDOR Enforcement at Service Layer

**Applies to**: All service methods that access user-scoped resources

The `userId` for every data operation is sourced exclusively from `request.user.sub` (set by
`authenticate` preHandler). It is never accepted from the request body or query string.

Controllers extract `userId` from `request.user.sub` and pass it explicitly:
```typescript
// Controller (correct):
const userId = request.user.sub
await authService.logout({ accessJti, accessExp, userId, refreshToken })

// Body userId ignored — never trusted:
// const { userId } = request.body  ← NEVER
```

---

## Pattern 15 — Email Normalisation

**Applies to**: `AuthService.register()` and `AuthService.login()`

Email is normalised at the service boundary before any persistence or comparison:
```typescript
const email = input.email.trim().toLowerCase()
```

Applied consistently across register, login, and all lookups. The `UserRepository` always
receives a pre-normalised email.
