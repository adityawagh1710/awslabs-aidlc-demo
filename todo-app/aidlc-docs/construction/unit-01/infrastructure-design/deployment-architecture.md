# Deployment Architecture — UNIT-01: DB & Infrastructure Foundation

## GitHub Actions CI Pipeline

### Workflow File
`.github/workflows/ci.yml`

### Triggers
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### Job Graph

```
Push / PR event
      │
      ├──────────────────┬──────────────────┐
      ▼                  ▼                  │
  ┌─────────┐       ┌────────────┐          │
  │  lint   │       │ type-check │          │
  │ ESLint  │       │  tsc       │          │
  └────┬────┘       └─────┬──────┘          │
       │                  │                 │
       └──────┬───────────┘                 │
              ▼                             │
         ┌─────────┐                        │
         │  test   │                        │
         │ Vitest  │                        │
         │ + PG/   │                        │
         │ Redis   │                        │
         └────┬────┘                        │
              │                             │
              ▼                             │
   ┌──────────────────────┐                 │
   │  docker              │  (main only)    │
   │  build + push GHCR  │◄────────────────┘
   └──────────────────────┘
```

### Job Definitions

#### Job: `lint`
```yaml
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: '22', cache: 'npm' }
  - run: npm ci
  - run: npm run lint
```

#### Job: `type-check`
```yaml
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: '22', cache: 'npm' }
  - run: npm ci
  - run: npm run type-check    # tsc --noEmit
```

#### Job: `test`
```yaml
runs-on: ubuntu-latest
needs: [lint, type-check]
services:
  postgres:
    image: postgres:17-alpine
    env:
      POSTGRES_USER: todo_app
      POSTGRES_PASSWORD: ci_password
      POSTGRES_DB: todo_test
    ports: ['5432:5432']
    options: >-
      --health-cmd "pg_isready -U todo_app -d todo_test"
      --health-interval 5s
      --health-retries 5
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 5s
      --health-retries 5
env:
  NODE_ENV: test
  DATABASE_URL_TEST: postgresql://todo_app:ci_password@localhost:5432/todo_test
  REDIS_URL: redis://localhost:6379
  JWT_SECRET: ci-test-secret-minimum-32-chars-long
  JWT_EXPIRES_IN: 15m
  JWT_ISSUER: todo-api
  JWT_AUDIENCE: todo-client
  BCRYPT_ROUNDS: 4           # Low rounds for test speed
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: '22', cache: 'npm' }
  - run: npm ci
  - run: npx prisma migrate deploy
    env: { DATABASE_URL: ${{ env.DATABASE_URL_TEST }} }
  - run: npm test
```

#### Job: `docker`
```yaml
runs-on: ubuntu-latest
needs: [test]
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
permissions:
  contents: read
  packages: write
steps:
  - uses: actions/checkout@v4
  - uses: docker/login-action@v3
    with:
      registry: ghcr.io
      username: ${{ github.actor }}
      password: ${{ secrets.GITHUB_TOKEN }}   # Built-in — no extra secret needed
  - uses: docker/build-push-action@v5
    with:
      context: .
      target: production
      push: true
      tags: |
        ghcr.io/${{ github.repository }}:latest
        ghcr.io/${{ github.repository }}:${{ github.sha }}
```

### CI Summary Table

| Job | Needs | Runs on | When |
|---|---|---|---|
| `lint` | — | ubuntu-latest | push + PR |
| `type-check` | — | ubuntu-latest | push + PR |
| `test` | lint, type-check | ubuntu-latest + services | push + PR |
| `docker` | test | ubuntu-latest | push to `main` only |

---

## npm Scripts (package.json)

Code Generation will produce a `package.json` with these scripts wired to the CI jobs above:

| Script | Command | Used by CI job |
|---|---|---|
| `lint` | `eslint . --max-warnings 0` | `lint` |
| `lint:fix` | `eslint . --fix` | (local dev) |
| `type-check` | `tsc --noEmit` | `type-check` |
| `format` | `prettier --write .` | (local dev) |
| `format:check` | `prettier --check .` | (optional gate) |
| `test` | `vitest run` | `test` |
| `test:watch` | `vitest` | (local dev) |
| `test:coverage` | `vitest run --coverage` | (local dev) |
| `build` | `tsc -p tsconfig.build.json` | (production build) |
| `start` | `node dist/server.js` | (production) |
| `dev` | `tsx watch src/server.ts` | (local dev without Docker) |
| `db:migrate` | `prisma migrate dev` | (local dev) |
| `db:migrate:deploy` | `prisma migrate deploy` | (CI + production) |
| `db:studio` | `prisma studio` | (local dev) |

---

## GHCR Image Naming

| Tag | When published | Use |
|---|---|---|
| `ghcr.io/<owner>/todo-backend:latest` | Every push to `main` | Staging / quick pull |
| `ghcr.io/<owner>/todo-backend:<sha>` | Every push to `main` | Immutable production reference |

Image visibility: private by default (matches private repo). Set to public in GitHub package settings if repo is public.

---

## Production Deployment (Out of Scope for UNIT-01)

Production environment (ECS, Kubernetes, etc.) will:
1. Pull `ghcr.io/<owner>/todo-backend:<sha>`
2. Inject all env vars from a secrets manager (AWS Secrets Manager, GCP Secret Manager, etc.)
3. Run `npx prisma migrate deploy` as a pre-start task / init container
4. Set `CORS_ORIGIN` to the frontend's actual domain
5. Expose port 3000 behind a load balancer with TLS termination

This is documented here as a placeholder and will be detailed in the Operations phase.
