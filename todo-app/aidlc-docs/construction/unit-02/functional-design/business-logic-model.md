# Business Logic Model — UNIT-02: Backend Auth & User Management

## Overview
Auth manages the full identity lifecycle: registration, credential verification, token issuance
(access + refresh), token rotation, and revocation. All flows enforce IDOR prevention at the
service layer — every resource access is scoped to the authenticated user.

---

## Flow 1 — Register (`POST /api/v1/auth/register`)

```
Client → POST /api/v1/auth/register { email, password }
          │
          ▼
1. Validate input schema (email format, password complexity)
          │
          ▼
2. Normalise email (lowercase + trim)
          │
          ▼
3. Check if email already registered (UserRepository.findByEmail)
   └── ConflictError("Email already registered") if found
          │
          ▼
4. Hash password (bcryptjs, BCRYPT_ROUNDS)
          │
          ▼
5. Create user record (UserRepository.create)
          │
          ▼
6. Generate token pair (TokenService.signPair)
   ├── Access token (JWT, 15m, jti = cuid())
   └── Refresh token (JWT, 7d, jti = cuid(), type = "refresh")
          │
          ▼
7. Store refresh token in Redis
   └── SET refresh:{refreshJti} {userId} EX 604800 (7 days)
          │
          ▼
8. Return 201 { accessToken, refreshToken, user: { id, email } }
```

---

## Flow 2 — Login (`POST /api/v1/auth/login`)

```
Client → POST /api/v1/auth/login { email, password }
          │
          ▼
1. Validate input schema
          │
          ▼
2. Normalise email (lowercase + trim)
          │
          ▼
3. Check account lockout (Redis GET lockout:{email})
   └── UnauthorizedError("Account temporarily locked") if locked
          │
          ▼
4. Find user by email (UserRepository.findByEmail)
   └── UnauthorizedError("Invalid credentials") if not found
         (generic message prevents user enumeration — SECURITY-11)
          │
          ▼
5. Verify password (bcryptjs.compare)
   └── On failure:
       a. Increment failure counter (Redis INCR attempts:{email} → set TTL 15min on first)
       b. If counter ≥ 5: SET lockout:{email} 1 EX 900 (15 min), DEL attempts:{email}
       c. UnauthorizedError("Invalid credentials")
          │
          ▼
6. On success: DEL attempts:{email} (reset counter)
          │
          ▼
7. Generate token pair (TokenService.signPair)
          │
          ▼
8. Store refresh token in Redis (SET refresh:{refreshJti} {userId} EX 604800)
          │
          ▼
9. Return 200 { accessToken, refreshToken, user: { id, email } }
```

---

## Flow 3 — Refresh (`POST /api/v1/auth/refresh`)

```
Client → POST /api/v1/auth/refresh { refreshToken }
          │
          ▼
1. Verify JWT signature and expiry (TokenService.verify)
   └── UnauthorizedError if invalid/expired
          │
          ▼
2. Check token type claim === "refresh"
   └── UnauthorizedError if not refresh token
          │
          ▼
3. Check refresh token exists in Redis (GET refresh:{jti})
   └── UnauthorizedError("Token has been revoked") if missing
          │
          ▼
4. Load user from DB (UserRepository.findById(sub))
   └── UnauthorizedError if user not found (account deleted)
          │
          ▼
5. Rotate: delete old refresh token from Redis (DEL refresh:{jti})
          │
          ▼
6. Issue new token pair (TokenService.signPair)
          │
          ▼
7. Store new refresh token in Redis
          │
          ▼
8. Return 200 { accessToken, refreshToken, user: { id, email } }
```

---

## Flow 4 — Logout (`POST /api/v1/auth/logout`)
*Requires authentication (authenticate preHandler)*

```
Client → POST /api/v1/auth/logout { refreshToken }
  (Authorization: Bearer <accessToken>)
          │
          ▼
1. authenticate preHandler runs (JWT verify + blacklist check)
          │
          ▼
2. Blacklist the access token:
   SET blacklist:{accessJti} 1 EX {remaining_ttl_seconds}
          │
          ▼
3. Parse refreshToken from body (optional — if provided, revoke it)
   └── If valid JWT: DEL refresh:{refreshJti} from Redis
          │
          ▼
4. Return 204 No Content
```

---

## Flow 5 — Session Expiry (US-04)

No server-side action required. The access token's `exp` claim enforces expiry.
When the client receives a 401 with `error: "UnauthorizedError"`:
- Frontend clears auth state and redirects to `/login`
- If refresh token is available and valid, frontend tries Flow 3 first

---

## Flow 6 — API Authentication (US-17)

Same as browser auth. API consumers (Casey persona):
1. `POST /api/v1/auth/login` → receive `{ accessToken, refreshToken }`
2. Include `Authorization: Bearer <accessToken>` on all subsequent requests
3. On 401, use `POST /api/v1/auth/refresh` with the refresh token
