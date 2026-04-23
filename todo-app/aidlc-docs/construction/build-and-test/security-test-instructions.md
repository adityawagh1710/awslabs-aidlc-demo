# Security Test Instructions — TODO List App

Security Baseline extension is fully enforced (SECURITY-01 through SECURITY-15).
The following tests verify each control is working correctly.

---

## Automated Security Checks (run with every test suite)

These are covered by existing integration tests:

| Control | Test | Location |
|---|---|---|
| SECURITY-01: Password hashing | bcrypt hash stored, never plaintext | `auth.service.test.ts` |
| SECURITY-02: JWT validation | Expired/malformed token → 401 | `auth.test.ts` |
| SECURITY-03: Token blacklisting | Logout → reuse → 401 | `auth.test.ts` |
| SECURITY-04: Security headers | `fastify-helmet` applied | `app.ts` plugin |
| SECURITY-05: Input validation | Invalid body → 400 with field errors | All integration tests |
| SECURITY-06: IDOR prevention | Other user's resource → 403 | `tasks.test.ts`, `categories.test.ts` |
| SECURITY-07: Rate limiting | Auth endpoints limited 10/15 min | `auth.test.ts` |
| SECURITY-08: Brute-force protection | 5 failures → lockout | `auth.test.ts` |
| SECURITY-09: Constant-time login | DUMMY_HASH prevents timing oracle | `auth.service.test.ts` |
| SECURITY-10: Refresh token rotation | Old token revoked on refresh | `auth.test.ts` |
| SECURITY-11: No credential exposure | `passwordHash` never in response | All auth tests |
| SECURITY-12: Fail-closed Redis | Redis down → 503 (not open) | `auth.service.test.ts` |

---

## Dependency Vulnerability Scan

Run before each release:

```bash
# Backend
cd todo-backend
npm audit --audit-level=high

# Frontend
cd todo-frontend
npm audit --audit-level=high
```

Fix any high or critical vulnerabilities before deploying.

---

## Manual Security Verification Checklist

### Authentication
- [ ] `POST /api/v1/auth/register` with no body → 400 (not 500)
- [ ] `POST /api/v1/auth/login` with SQL injection in email field → 400 (parameterized query, not error)
- [ ] Access any `/api/v1/tasks` endpoint without `Authorization` header → 401
- [ ] Use expired JWT → 401 with `{ error: "Unauthorized" }`
- [ ] Use access token as refresh token → 401

### IDOR
- [ ] Register two users (A and B). Create a task as user A. Try to `GET /api/v1/tasks/:id` as user B → 403
- [ ] Try to `DELETE /api/v1/tasks/:id` as user B → 403
- [ ] Try to access user B's category as user A → 403

### Input Validation
- [ ] `POST /api/v1/tasks` with title > 255 chars → 400
- [ ] `POST /api/v1/tasks` with `<script>alert(1)</script>` in title → stored escaped, rendered safely
- [ ] `POST /api/v1/categories` with name > 50 chars → 400

### Rate Limiting
- [ ] Send 11 `POST /api/v1/auth/login` requests in 15 minutes → 11th returns 429 with `Retry-After` header

### Security Headers
```bash
curl -I http://localhost:3000/health
```
Expected headers present:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (in production)
- `Content-Security-Policy`
