# Logical Components — UNIT-02: Backend Auth & User Management

All UNIT-01 components are inherited. This document defines UNIT-02 additions only.

---

## Component Map

```
auth.routes.ts
    │ injects
    ├──► AuthController
    │         │ calls
    │         └──► AuthService
    │                   │ calls
    │                   ├──► UserRepository (Prisma)
    │                   ├──► TokenService (ioredis + @fastify/jwt)
    │                   └──► BruteForceService (ioredis)
    │
    └──► rate-limit override (10 req/15 min on /api/v1/auth/*)
```

---

## Component Definitions

### `src/routes/auth.routes.ts` — Auth Route Registration
| Attribute | Detail |
|---|---|
| **Responsibility** | Register auth routes under `/api/v1/auth`; apply rate-limit override; wire schema validation |
| **Rate limit override** | `{ config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }` per route options |
| **Routes** | `POST /register`, `POST /login`, `POST /logout` (authenticated), `POST /refresh` |
| **Schema** | JSON schema objects for body validation (email, password) inline in route definitions |

---

### `src/controllers/auth.controller.ts` — Auth Controller
| Attribute | Detail |
|---|---|
| **Responsibility** | Extract validated input from request; extract `ip` and `userAgent`; call `AuthService`; return response |
| **Context extraction** | `ip = request.ip`, `userAgent = request.headers['user-agent'] ?? 'unknown'` |
| **Never does** | Business logic, direct DB access, direct Redis access |
| **Constructor** | `constructor(private readonly authService: AuthService)` |

---

### `src/services/auth.service.ts` — Auth Service
| Attribute | Detail |
|---|---|
| **Responsibility** | Orchestrate register/login/refresh/logout flows; emit auth events via logger |
| **Constructor** | `constructor(private readonly userRepo, tokenService, bruteForceService, log)` |
| **Constant-time** | Module-level `DUMMY_HASH` initialised on startup for missing-user path |
| **Auth events** | Logged inline at outcome point (Pattern 13) |

---

### `src/services/token.service.ts` — Token Service
| Attribute | Detail |
|---|---|
| **Responsibility** | JWT sign/verify; access token blacklisting; refresh token store/revoke |
| **Constructor** | `constructor(private readonly fastify: FastifyInstance)` — uses `fastify.jwt` and `fastify.redis` |
| **Key methods** | `signPair()`, `verify()`, `blacklistAccess()`, `storeRefresh()`, `revokeRefresh()`, `isRefreshValid()` |
| **signPair()** | Generates two `cuid()` values for `jti`; signs access (type: "access") and refresh (type: "refresh") |
| **blacklistAccess()** | `SET blacklist:{jti} 1 EX {remainingTtl}` — remaining TTL = `exp - Math.floor(Date.now()/1000)` |
| **storeRefresh()** | `SET refresh:{jti} {userId} EX 604800` |

---

### `src/services/brute-force.service.ts` — Brute Force Service (new file)
| Attribute | Detail |
|---|---|
| **Responsibility** | Manage per-email login failure counter and account lockout in Redis |
| **Constructor** | `constructor(private readonly redis: Redis)` |
| **Key methods** | `isLocked(email)`, `recordFailure(email)`, `reset(email)` |
| **isLocked()** | `EXISTS lockout:{email}` → boolean |
| **recordFailure()** | `INCR attempts:{email}`; if first (result === 1): `EXPIRE attempts:{email} 900`; if ≥ 5: `SET lockout:{email} 1 EX 900` + `DEL attempts:{email}` |
| **reset()** | `DEL attempts:{email}` |

---

### `src/services/user.service.ts` — User Service
| Attribute | Detail |
|---|---|
| **Responsibility** | User lookup and creation (thin wrapper over UserRepository) |
| **Constructor** | `constructor(private readonly userRepo: UserRepository)` |
| **Key methods** | `findById(id)`, `findByEmail(email)`, `create({ email, passwordHash })` |

---

### `src/repositories/user.repository.ts` — User Repository
| Attribute | Detail |
|---|---|
| **Responsibility** | Prisma queries for User model |
| **Constructor** | `constructor(private readonly prisma: PrismaClient)` |
| **Key methods** | `findById(id)`, `findByEmail(normalised_email)`, `create({ email, passwordHash })` |
| **findByEmail()** | Accepts only pre-normalised email; no normalisation inside repository |

---

## Request Flow — Login

```
POST /api/v1/auth/login
    │
    ▼
rate-limit check (10/15 min per IP)
    │
    ▼
AJV schema validation (email format, password min length in body schema)
    │
    ▼
AuthController.login(request, reply)
    ├── ip = request.ip
    ├── userAgent = request.headers['user-agent']
    └── authService.login({ email, password, ip, userAgent })
            │
            ├── normalise email
            ├── bruteForceService.isLocked(email) → 401 if locked
            ├── userRepo.findByEmail(email) → null? → bcrypt.compare(pw, DUMMY_HASH) → 401
            ├── bcrypt.compare(password, user.passwordHash)
            │     └── false → bruteForceService.recordFailure(email) → 401
            ├── bruteForceService.reset(email)
            ├── tokenService.signPair(user.id)
            ├── tokenService.storeRefresh(refreshJti, user.id)
            ├── log.info { event: 'login.success', ... }
            └── return { accessToken, refreshToken, user: UserDto }
    │
    ▼
reply.status(200).send({ accessToken, refreshToken, user })
```

---

## Dependency Wiring

All services are instantiated once and passed by constructor injection in `auth.routes.ts`:

```typescript
// Instantiation in auth.routes.ts (top of plugin)
const userRepo = new UserRepository(prisma)
const userService = new UserService(userRepo)
const tokenService = new TokenService(fastify)
const bruteForceService = new BruteForceService(fastify.redis)
const authService = new AuthService(userRepo, tokenService, bruteForceService, fastify.log)
const authController = new AuthController(authService)
```

No DI container — constructor injection is sufficient for this scale.
