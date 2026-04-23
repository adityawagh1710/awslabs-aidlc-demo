# Code Generation Summary — UNIT-02: Backend Auth & User Management

## Status
All 14 steps completed. UNIT-02 code generation is complete.

## Files Modified (stubs → full implementation)

| File | Stories |
|---|---|
| `src/types/fastify.d.ts` | All — added `type: 'access' \| 'refresh'` to `TokenPayload` |
| `src/repositories/user.repository.ts` | US-01, US-02 |
| `src/services/user.service.ts` | US-01, US-02 |
| `src/services/token.service.ts` | US-02, US-03, US-04, US-17 |
| `src/services/auth.service.ts` | US-01, US-02, US-03, US-04, US-17 |
| `src/controllers/auth.controller.ts` | US-01, US-02, US-03, US-04, US-17 |
| `src/routes/auth.routes.ts` | US-01, US-02, US-03, US-04, US-17 |

## Files Created (new)

| File | Purpose |
|---|---|
| `src/services/brute-force.service.ts` | Per-email login failure counter + lockout in Redis |
| `tests/unit/token.service.test.ts` | Unit tests + PBT-02 round-trip |
| `tests/unit/brute-force.service.test.ts` | Unit tests + PBT-04 threshold invariant |
| `tests/unit/auth.service.test.ts` | Unit tests + PBT-01 register→login round-trip |
| `tests/integration/auth.test.ts` | Full HTTP integration tests + PBT-05 email normalisation |
| `tests/property/auth.property.test.ts` | Standalone PBT: JWT round-trip, hash round-trip, blacklist idempotency |

## Key Design Decisions

### JTI Generation
Used `crypto.randomUUID()` (Node.js built-in, cryptographically secure) instead of `cuid()` — no additional dependency required.

### DUMMY_HASH
Initialised in `AuthService` constructor via `bcrypt.hashSync()` — runs once at startup (~250ms acceptable), eliminates timing oracle for unknown emails.

### Constant-Time Login
`findByEmail` result is checked after `bcrypt.compare` always runs. Unknown email → compare against `DUMMY_HASH` → same timing as valid email + wrong password path.

### Token Type Enforcement
`refresh()` in `AuthService` explicitly checks `payload.type === 'refresh'` to prevent access tokens being used as refresh tokens (and vice versa).

### Constructor Injection Wiring
All services instantiated once at the top of `auth.routes.ts` Fastify plugin — no DI container needed at this scale.

### Rate Limit Override
Each auth route applies `{ config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }` to override the global 200/15 min limit.

## Security Controls Implemented

| Control | Implementation |
|---|---|
| IDOR prevention | `userId` from `request.user.sub` only, never from request body |
| Credential exposure | `passwordHash` excluded from all `UserDto` responses |
| Brute-force protection | `BruteForceService` — lockout at 5 failures, 15-minute window |
| Token blacklisting | `blacklist:{jti}` Redis key with remaining TTL on logout |
| Refresh token rotation | Old refresh JTI revoked before new pair issued |
| Constant-time comparison | `DUMMY_HASH` eliminates timing oracle on missing users |
| Fail-closed auth | `ServiceUnavailableError` (503) when Redis unavailable during auth check |
| Audit logging | 7 event types logged at info/warn with ip, userAgent, userId, email |

## PBT Coverage

| PBT ID | Test File | Invariant |
|---|---|---|
| PBT-01 | `auth.service.test.ts` | register→login round-trip for arbitrary email+password |
| PBT-02 | `token.service.test.ts`, `auth.property.test.ts` | JWT sub round-trip; hash round-trip |
| PBT-04 | `brute-force.service.test.ts`, `auth.property.test.ts` | Lockout at exactly 5; blacklist idempotency |
| PBT-05 | `auth.test.ts`, `auth.property.test.ts` | Email normalisation idempotency |

## Redis Key Patterns

| Pattern | Purpose | TTL |
|---|---|---|
| `blacklist:{jti}` | Revoked access tokens | Remaining token lifetime |
| `refresh:{jti}` | Active refresh tokens → userId | 7 days (604800s) |
| `attempts:{email}` | Failed login counter | 15 minutes (900s) |
| `lockout:{email}` | Account lockout flag | 15 minutes (900s) |
