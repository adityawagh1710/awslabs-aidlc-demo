# Domain Entities — UNIT-02: Backend Auth & User Management

## User

The core identity entity. All other resources (tasks, categories) are scoped to a User.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `string` (cuid) | PK, auto-generated | Stable identifier; never exposed in error messages |
| `email` | `string` | Unique, not null | Stored normalised (lowercase, trimmed); max 254 chars |
| `passwordHash` | `string` | Not null | bcryptjs output; never returned in API responses |
| `createdAt` | `DateTime` | Not null, default now() | Read-only after creation |
| `updatedAt` | `DateTime` | Not null, auto-updated | Managed by Prisma `@updatedAt` |

### User — API Response Shape
```typescript
interface UserDto {
  id: string
  email: string
  createdAt: string  // ISO-8601
}
// passwordHash is NEVER included in any response
```

---

## TokenPayload (JWT claims)

Carried inside every signed JWT. Shared between access and refresh tokens.

| Claim | Type | Notes |
|---|---|---|
| `sub` | `string` | User `id` — the subject (owner) |
| `jti` | `string` (cuid) | Unique token ID — used as Redis key for blacklist/refresh store |
| `type` | `"access"` \| `"refresh"` | Distinguishes token purpose; validated before use |
| `iat` | `number` | Issued-at (Unix seconds) — set by `@fastify/jwt` |
| `exp` | `number` | Expiry (Unix seconds) — set by `@fastify/jwt` |
| `iss` | `string` | Issuer (`JWT_ISSUER`) |
| `aud` | `string` | Audience (`JWT_AUDIENCE`) |

---

## Redis Entities (ephemeral — not in Prisma)

### Blacklisted Access Token
```
Key:   blacklist:{jti}
Value: "1"
TTL:   Remaining seconds until token's exp claim
```

### Refresh Token Reference
```
Key:   refresh:{jti}
Value: {userId}
TTL:   604800 (7 days)
```

### Login Failure Counter
```
Key:   attempts:{normalised_email}
Value: integer (1–5)
TTL:   900 (15 minutes, set on first failure)
```

### Account Lockout
```
Key:   lockout:{normalised_email}
Value: "1"
TTL:   900 (15 minutes, auto-expires)
```

---

## Service Interfaces

### AuthService
```typescript
interface AuthService {
  register(input: {
    email: string
    password: string
  }): Promise<{ accessToken: string; refreshToken: string; user: UserDto }>

  login(input: {
    email: string
    password: string
  }): Promise<{ accessToken: string; refreshToken: string; user: UserDto }>

  refresh(input: {
    refreshToken: string
  }): Promise<{ accessToken: string; refreshToken: string; user: UserDto }>

  logout(input: {
    accessJti: string
    accessExp: number    // Unix seconds — used to compute remaining TTL
    refreshToken?: string
  }): Promise<void>
}
```

### UserRepository
```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>  // email must be pre-normalised
  create(input: { email: string; passwordHash: string }): Promise<User>
}
```

### TokenService
```typescript
interface TokenService {
  signPair(userId: string): { accessToken: string; refreshToken: string }
  verify(token: string): TokenPayload          // throws UnauthorizedError if invalid
  blacklistAccess(jti: string, exp: number): Promise<void>
  storeRefresh(jti: string, userId: string): Promise<void>
  revokeRefresh(jti: string): Promise<void>
  isRefreshValid(jti: string): Promise<boolean>
}
```

### BruteForceService (new — extracted from AuthService for clarity)
```typescript
interface BruteForceService {
  isLocked(email: string): Promise<boolean>
  recordFailure(email: string): Promise<void>  // increments counter, sets lockout at 5
  reset(email: string): Promise<void>          // deletes attempts key on success
}
```
