# Code Generation Plan — UNIT-02: Backend Auth & User Management

## Unit Context
- **Repository**: `todo-backend/` (existing — extending UNIT-01 scaffold)
- **Type**: Feature — Backend (brownfield of UNIT-01)
- **Stories implemented**: US-01 Register, US-02 Login, US-03 Logout, US-04 Session Expiry, US-17 API Auth
- **Dependencies**: UNIT-01 (Fastify scaffold, Prisma, Redis, domain errors, auth plugin)

## Files Modified vs Created
- **Modified** (stubs → full implementation): 6 files
- **Created** (new): `brute-force.service.ts` + all test files + summary
- **No schema changes**: Prisma User model already complete in UNIT-01

## Step Sequence

---

### PART A — Type & Repository Layer

**Step 1** — Update `src/types/fastify.d.ts`
- [x] Add `type: 'access' | 'refresh'` field to `TokenPayload` interface

**Step 2** — Implement `src/repositories/user.repository.ts`
- [x] `findById(id: string): Promise<User | null>` — Prisma `findUnique`
- [x] `findByEmail(email: string): Promise<User | null>` — Prisma `findUnique` by email
- [x] `create(input: { email: string; passwordHash: string }): Promise<User>` — Prisma `create`
- [x] Story: US-01 (create), US-02 (findByEmail)

---

### PART B — Service Layer

**Step 3** — Implement `src/services/user.service.ts`
- [x] Thin wrapper over `UserRepository` — `findById`, `findByEmail`, `create`

**Step 4** — Implement `src/services/token.service.ts`
- [x] `signPair(userId: string)` — generate two `cuid()` JTIs; sign access (15m, type:"access") and refresh (7d, type:"refresh") via `fastify.jwt.sign`
- [x] `verify(token: string): TokenPayload` — `fastify.jwt.verify`; throws `UnauthorizedError` on failure
- [x] `blacklistAccess(jti: string, exp: number)` — Redis `SET blacklist:{jti} 1 EX {remaining}`
- [x] `storeRefresh(jti: string, userId: string)` — Redis `SET refresh:{jti} {userId} EX 604800`
- [x] `revokeRefresh(jti: string)` — Redis `DEL refresh:{jti}`
- [x] `isRefreshValid(jti: string)` — Redis `EXISTS refresh:{jti}` → boolean
- [x] Story: US-02, US-03, US-04, US-17

**Step 5** — Create `src/services/brute-force.service.ts` (new file)
- [x] `isLocked(email: string): Promise<boolean>` — Redis `EXISTS lockout:{email}`
- [x] `recordFailure(email: string): Promise<void>` — `INCR attempts:{email}`; set `EXPIRE` on first; `SET lockout` + `DEL attempts` at threshold 5
- [x] `reset(email: string): Promise<void>` — `DEL attempts:{email}`
- [x] Story: US-02 (brute-force AC)

**Step 6** — Implement `src/services/auth.service.ts`
- [x] `DUMMY_HASH` constant initialised at module load (bcrypt hash of 'dummy')
- [x] `register({ email, password })` — normalise → check duplicate → hash → create user → signPair → storeRefresh → log → return
- [x] `login({ email, password, ip, userAgent })` — normalise → lockout check → findByEmail → constant-time compare → failure tracking → signPair → storeRefresh → log → return
- [x] `refresh({ refreshToken })` — verify JWT → check type claim → isRefreshValid → revokeRefresh → signPair → storeRefresh → log → return
- [x] `logout({ accessJti, accessExp, refreshToken?, ip, userAgent, userId })` — blacklistAccess → revokeRefresh (if provided) → log → return
- [x] Story: US-01, US-02, US-03, US-04, US-17

---

### PART C — Controller & Routes

**Step 7** — Implement `src/controllers/auth.controller.ts`
- [x] `register(request, reply)` — extract body; call `authService.register`; `reply.status(201).send(...)`
- [x] `login(request, reply)` — extract body + ip + userAgent; call `authService.login`; `reply.status(200).send(...)`
- [x] `refresh(request, reply)` — extract body; call `authService.refresh`; `reply.status(200).send(...)`
- [x] `logout(request, reply)` — extract `request.user.sub`, `jti`, `exp` from JWT; call `authService.logout`; `reply.status(204).send()`

**Step 8** — Implement `src/routes/auth.routes.ts`
- [x] Instantiate services and controller via constructor injection
- [x] `POST /register` — body schema (email, password); rate-limit override 10/15 min; → `authController.register`
- [x] `POST /login` — body schema; rate-limit override; → `authController.login`
- [x] `POST /refresh` — body schema (`refreshToken` string); rate-limit override; → `authController.refresh`
- [x] `POST /logout` — body schema (optional `refreshToken`); `preHandler: [fastify.authenticate]`; → `authController.logout`
- [x] Story: US-01, US-02, US-03, US-04, US-17

---

### PART D — Tests

**Step 9** — Unit tests: `tests/unit/token.service.test.ts`
- [x] `signPair` produces two valid JWTs with correct `type` claims
- [x] `verify` returns payload for valid token; throws `UnauthorizedError` for invalid/expired
- [x] PBT (PBT-02): round-trip property — `verify(sign(payload)).sub === payload.sub` for arbitrary userId strings

**Step 10** — Unit tests: `tests/unit/brute-force.service.test.ts`
- [x] `isLocked` returns false when no lockout key; true when key exists
- [x] `recordFailure` increments counter; triggers lockout at exactly 5 failures
- [x] `reset` clears attempt counter
- [x] PBT (PBT-04): lockout threshold invariant — exactly 5 calls to `recordFailure` always produces lockout; 4 never does

**Step 11** — Unit tests: `tests/unit/auth.service.test.ts`
- [x] `register` success path; duplicate email → `ConflictError`
- [x] `login` success path; wrong password → `UnauthorizedError`; locked account → `UnauthorizedError`
- [x] `refresh` rotates tokens; invalid/expired token → `UnauthorizedError`
- [x] `logout` blacklists access token and revokes refresh token
- [x] PBT (PBT-01): register→login round-trip — any valid email+password that passes validation can always login after registering

**Step 12** — Integration tests: `tests/integration/auth.test.ts`
- [x] `POST /register` → 201 with `{ accessToken, refreshToken, user }`
- [x] `POST /register` duplicate email → 409
- [x] `POST /login` valid credentials → 200
- [x] `POST /login` invalid password → 401 (generic message)
- [x] `POST /refresh` valid refresh token → 200 with new token pair
- [x] `POST /logout` authenticated → 204; subsequent request with blacklisted token → 401
- [x] PBT (PBT-05): email normalisation idempotency — `normalise(normalise(email)) === normalise(email)`

**Step 13** — PBT: `tests/property/auth.property.test.ts`
- [x] JWT round-trip: `verify(sign({ sub, jti, type })).sub === sub` for arbitrary CUID-like sub values (PBT-02)
- [x] Password hash round-trip: `compare(pw, hash(pw))` always true; `compare(other, hash(pw))` always false when `other !== pw` (PBT-02)
- [x] Blacklist idempotency: blacklisting same `jti` twice does not throw; token remains invalid (PBT-04)

---

### PART E — Documentation

**Step 14** — Code generation summary
- [x] Create `aidlc-docs/construction/unit-02/code/summary.md`
