# Functional Design Plan — UNIT-02: Backend Auth & User Management

## Unit Context
- **Stories**: US-01 Register, US-02 Login, US-03 Logout, US-04 Session Expiry, US-17 API Auth
- **Depends on**: UNIT-01 (Fastify scaffold, Prisma, Redis, domain errors)
- **Key concerns**: Password security, JWT lifecycle, brute-force prevention, IDOR baseline

## Plan Checklist
- [x] Read unit-of-work.md and story map for UNIT-02 scope
- [x] Identified business logic areas requiring user clarification (5 questions)
- [x] Questions answered by user
- [x] Functional design artifacts generated
- [x] Artifacts approved

---

## Questions — Please Fill in Every `[Answer]:` Tag

### Q1 — Password Requirements
What are the minimum password requirements for registration?

- A — Minimum 8 characters, no other constraints (simple — easiest for users)
- B — Minimum 8 characters + at least one uppercase, one lowercase, one digit (moderate complexity)
- C — Minimum 12 characters + at least one uppercase, one lowercase, one digit, one special character (strong — OWASP recommended)

[Answer]:B

---

### Q2 — Email Handling
When a user registers or logs in, how should email addresses be treated?

- A — Normalise to lowercase and trim whitespace before storing/comparing (recommended — prevents duplicate accounts via `User@example.com` vs `user@example.com`)
- B — Store exactly as entered, compare case-sensitively

[Answer]:A

---

### Q3 — Brute-Force Protection Strategy
Auth endpoints need protection against credential-stuffing and brute-force attacks (SECURITY-11).

- **Per-IP rate limiting** (already set at 200 req/15 min globally — needs auth-specific tightening):
- **Per-email account lockout**: Lock the account after N failed login attempts for a duration.

Which brute-force strategy should be used?

- A — IP-based rate limiting only: tighten auth routes to 10 requests per 15 minutes per IP (simpler, no account lockout state)
- B — Both IP rate limiting (10/15 min) AND per-email soft lockout: after 5 failed attempts, lock the account for 15 minutes (stronger — recommended for production)

[Answer]:B

---

### Q4 — Account Lockout Storage (only if Q3 = B)
If per-email lockout is chosen, where should lockout state be stored?

- A — Redis: `lockout:{email}` key with TTL = lockout duration (auto-expiry, no cleanup needed — recommended)
- B — PostgreSQL: add `failedLoginAttempts` and `lockedUntil` columns to the User model

[Answer]:A

---

### Q5 — Refresh Token Strategy
The current design uses short-lived access tokens (15 m, configurable). When a token expires, the user must log in again. An alternative is a refresh token pattern.

- A — No refresh tokens: when the access token expires, the user is redirected to `/login` (simpler — aligns with current session expiry AC in US-04)
- B — Refresh tokens: issue a second long-lived token on login; client uses it to get a new access token silently (better UX, but adds `/api/v1/auth/refresh` endpoint and refresh token storage)

[Answer]:B
