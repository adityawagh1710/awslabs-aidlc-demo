# Domain Entities — UNIT-03: Frontend Auth UI

## Redux Store Shape

```typescript
interface RootState {
  auth: AuthState
  ui:   UiState
  [authApi.reducerPath]: ReturnType<typeof authApi.reducer>
}
```

---

## AuthState

```typescript
interface AuthState {
  accessToken: string | null         // JWT access token — in-memory only, never persisted
  user:        UserDto | null        // Authenticated user summary
  isInitialised: boolean             // false until startup refresh check completes
  sessionExpiredMessage: string | null // Set on reactive 401 redirect; cleared on login
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isInitialised: false,
  sessionExpiredMessage: null,
}
```

### AuthState Actions

| Action | Payload | Effect |
|---|---|---|
| `setCredentials` | `{ accessToken: string; user: UserDto }` | Set token + user |
| `clearCredentials` | — | Reset to null (token, user, message) |
| `setInitialised` | `boolean` | Mark startup check complete |
| `setSessionExpiredMessage` | `string \| null` | Set/clear expiry message |

---

## UiState

```typescript
interface UiState {
  returnTo: string | null   // Path to redirect to after login (ephemeral, not persisted)
  toasts:   Toast[]
}

interface Toast {
  id:      string
  message: string
  variant: 'default' | 'destructive' | 'success'
}
```

### UiState Actions

| Action | Payload | Effect |
|---|---|---|
| `setReturnTo` | `string \| null` | Store path for post-login redirect |
| `clearReturnTo` | — | Set returnTo to null |
| `addToast` | `Omit<Toast, 'id'>` | Append toast (id generated via `crypto.randomUUID()`) |
| `removeToast` | `string` (id) | Remove toast by id |

---

## UserDto

```typescript
interface UserDto {
  id:        string    // CUID
  email:     string    // Normalised lowercase email
  createdAt: string    // ISO 8601 datetime string
}
```

---

## API Request / Response Types

### POST /api/v1/auth/register
```typescript
interface RegisterRequest {
  email:    string
  password: string
}

interface AuthResponse {
  accessToken:  string
  refreshToken: string
  user:         UserDto
}
```

### POST /api/v1/auth/login
```typescript
interface LoginRequest {
  email:    string
  password: string
}
// Response: AuthResponse (same as register)
```

### POST /api/v1/auth/refresh
```typescript
interface RefreshRequest {
  refreshToken: string
}

interface RefreshResponse {
  accessToken:  string
  refreshToken: string
}
```

### POST /api/v1/auth/logout
```typescript
interface LogoutRequest {
  refreshToken?: string
}
// Response: 204 No Content
```

---

## Form Value Types

### RegisterFormValues
```typescript
interface RegisterFormValues {
  email:           string
  password:        string
  confirmPassword: string
}
```

### LoginFormValues
```typescript
interface LoginFormValues {
  email:    string
  password: string
}
```

---

## localStorage Keys

| Key | Value | Type |
|---|---|---|
| `todo_refresh_token` | JWT refresh token string | `string` |

---

## TokenPayload (decoded — scheduling use only)

```typescript
interface TokenPayload {
  sub:  string
  jti:  string
  type: 'access' | 'refresh'
  iat:  number
  exp:  number
  iss:  string
  aud:  string | string[]
}
```

Decoded via `JSON.parse(atob(token.split('.')[1]))` — no signature verification on the client.

---

## Refresh Timer Registry

Held in a module-level ref (not Redux state — timers are not serializable):

```typescript
let refreshTimerId: ReturnType<typeof setTimeout> | null = null

function scheduleProactiveRefresh(exp: number, dispatch: AppDispatch): void {
  if (refreshTimerId !== null) clearTimeout(refreshTimerId)
  const delayMs = Math.max(0, (exp - Math.floor(Date.now() / 1000) - 120) * 1000)
  refreshTimerId = setTimeout(() => silentRefresh(dispatch), delayMs)
}

function cancelScheduledRefresh(): void {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId)
    refreshTimerId = null
  }
}
```
