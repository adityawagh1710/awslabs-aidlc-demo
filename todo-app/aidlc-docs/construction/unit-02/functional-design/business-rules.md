# Business Rules — UNIT-02: Backend Auth & User Management

## Input Validation Rules

### Email
| Rule | Detail |
|---|---|
| Format | Must match RFC 5322 email format (validated by AJV `format: "email"`) |
| Normalisation | Lowercase + trim whitespace before any storage or comparison |
| Uniqueness | Unique constraint in PostgreSQL (`User.email` unique index); ConflictError on duplicate |
| Max length | 254 characters (RFC 5321 limit) |

### Password (Registration)
| Rule | Detail |
|---|---|
| Minimum length | 8 characters |
| Uppercase | At least one uppercase letter (A–Z) |
| Lowercase | At least one lowercase letter (a–z) |
| Digit | At least one digit (0–9) |
| Validation | Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/` |
| Max length | 72 characters (bcrypt limit — enforce to prevent DoS via long password hashing) |
| Storage | Never stored; only `passwordHash` (bcryptjs, configurable rounds) |
| Error message | Field-level: `"Password must be at least 8 characters with one uppercase, one lowercase, and one digit"` |

---

## Authentication Rules

### Credential Verification
| Rule | Detail |
|---|---|
| Email lookup | Always use normalised email; not found → generic "Invalid credentials" (prevents enumeration) |
| Password check | Always run `bcrypt.compare` even when user not found (constant-time dummy compare) |
| Error message | Always return the same message for "not found" and "wrong password" (SECURITY-11) |

### Brute-Force Protection
| Rule | Detail |
|---|---|
| Auth route rate limit | 10 requests per 15 minutes per IP (`@fastify/rate-limit` override on auth routes) |
| Failure counter key | `attempts:{normalised_email}` in Redis |
| Counter TTL | 15 minutes (reset window on first failure) |
| Lockout threshold | 5 consecutive failures → account locked |
| Lockout key | `lockout:{normalised_email}` in Redis |
| Lockout TTL | 15 minutes (auto-expiry — no manual unlock needed) |
| Lockout check | Checked before password verification; returns 401 with "Account temporarily locked. Try again in 15 minutes." |
| Counter reset | On successful login: `DEL attempts:{email}` |

---

## Token Rules

### Access Token (JWT)
| Rule | Detail |
|---|---|
| Algorithm | HS256 (via `@fastify/jwt`) |
| Secret | `JWT_SECRET` env var (min 32 chars) |
| Claims | `sub` (userId), `jti` (cuid — unique per token), `iat`, `exp`, `iss`, `aud`, `type: "access"` |
| Expiry | `JWT_EXPIRES_IN` env var (default `15m`) |
| Issuer | `JWT_ISSUER` env var (default `todo-api`) |
| Audience | `JWT_AUDIENCE` env var (default `todo-client`) |
| Blacklist | On logout: `SET blacklist:{jti} 1 EX {remaining_seconds}` in Redis |
| Transmission | `Authorization: Bearer <token>` request header |

### Refresh Token (JWT)
| Rule | Detail |
|---|---|
| Claims | Same as access token + `type: "refresh"` |
| Expiry | 7 days (604 800 seconds) |
| Storage | Redis: `SET refresh:{jti} {userId} EX 604800` |
| Rotation | Each use of `/auth/refresh` deletes the old key and creates a new token pair |
| Revocation on logout | `DEL refresh:{jti}` (if refresh token provided in logout body) |
| Transmission | Body field `refreshToken` (not in Authorization header) |

### Token Validation Order (authenticate preHandler)
1. Extract Bearer token from Authorization header
2. Verify JWT signature and claims (`jti`, `iss`, `aud`, `exp`)
3. Check `blacklist:{jti}` in Redis → 503 if Redis unavailable (fail-closed), 401 if blacklisted
4. Set `request.user = payload`

---

## Security Rules (SECURITY Extension)

| Rule | Enforcement |
|---|---|
| SECURITY-07 IDOR | All service methods accept `userId` as an explicit parameter; never trust client-supplied userId in body — always use `request.user.sub` |
| SECURITY-11 Credentials | Passwords never logged; tokens never logged; generic error messages for auth failures |
| SECURITY-14 Exception handling | All auth errors mapped through global error handler; no stack traces in production |

---

## Invariants (PBT-relevant)

These properties must hold for all inputs — used to define property-based tests (PBT-01, PBT-02):

1. **Register → Login invariant**: A successfully registered user can always log in with the same credentials (within the same test run)
2. **Password hash round-trip**: `bcrypt.compare(plaintext, hash)` is always true for the original password and always false for any other string
3. **JWT round-trip**: `verify(sign(payload))` always returns a payload where `sub`, `jti`, `type` match the original
4. **Blacklist idempotency**: Blacklisting the same `jti` twice does not cause errors and the token remains invalid
5. **Lockout threshold**: Exactly 5 failures always triggers lockout; 4 failures never does
6. **Email normalisation idempotency**: `normalise(normalise(email)) === normalise(email)` for any input
