# Infrastructure Design — UNIT-03: Frontend Auth UI

## Overview

UNIT-03 introduces a new `todo-frontend/` repository alongside the existing `todo-backend/`. Both repositories share the same docker-compose.yml for local development. The frontend adds a `frontend` Docker service and its own Dockerfile.

---

## Local Development Infrastructure

### New Docker Service — `frontend`

Added to the existing `docker-compose.yml` at the workspace root (alongside `db`, `redis`, `api`):

```yaml
frontend:
  build:
    context: ./todo-frontend
    target: development
  ports:
    - "5173:5173"
  volumes:
    - ./todo-frontend/src:/app/src:ro
    - ./todo-frontend/public:/app/public:ro
  environment:
    - NODE_ENV=development
  depends_on:
    - api
  networks:
    - todo-net
```

**Notes**:
- `depends_on: api` — starts after the API container; uses `service_started` (not `service_healthy` — no health check defined on the `api` service)
- Source bind-mounts (`src/`, `public/`) enable Vite HMR without rebuilding the image on every code change
- `node_modules` is **not** bind-mounted — it stays inside the container to avoid host/container platform conflicts

---

### Vite Dev Server Configuration (inside Docker)

`vite.config.ts` requires Docker-specific settings:

```typescript
server: {
  host: '0.0.0.0',       // bind to all interfaces — required for Docker port forwarding
  port: 5173,
  watch: {
    usePolling: true,    // required for HMR in Docker volume mounts on Linux/WSL
    interval: 100,
  },
  proxy: {
    '/api': {
      target: 'http://api:3000',   // Docker network hostname for the backend service
      changeOrigin: true,
    },
  },
},
```

**Proxy behaviour**: All `fetch('/api/v1/...')` calls from the browser are intercepted by the Vite dev server and forwarded to the backend container. No CORS headers needed for dev. `VITE_API_URL` is set to `/` (empty base path) in development — the proxy handles routing.

---

### Environment Variables

**`.env` (committed — safe defaults)**:
```
VITE_API_URL=/
```

**`.env.production` (committed)**:
```
VITE_API_URL=https://your-api-domain.com
```

**`.env.local` (gitignored — local overrides)**:
```
# Override if running frontend outside Docker pointing at a different backend
# VITE_API_URL=http://localhost:3000
```

---

## Dockerfile — `todo-frontend/Dockerfile`

Multi-stage build consistent with `todo-backend/Dockerfile` pattern from UNIT-01.

```dockerfile
# ── Stage: base ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage: development ────────────────────────────────────────────────────────
FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ── Stage: builder ────────────────────────────────────────────────────────────
FROM base AS builder
COPY . .
RUN npm run build

# ── Stage: production ─────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

---

## Nginx Configuration — `todo-frontend/nginx.conf`

Required for React Router — all paths must return `index.html` (SPA routing):

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively (Vite hashes filenames)
    location ~* \.(js|css|png|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;
}
```

---

## CI/CD — `.github/workflows/ci.yml` additions

Three new jobs added to the existing backend CI pipeline:

```yaml
frontend-lint:
  name: Frontend Lint & Type-check
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: todo-frontend
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '22', cache: 'npm', cache-dependency-path: 'todo-frontend/package-lock.json' }
    - run: npm ci
    - run: npm run lint
    - run: npm run type-check

frontend-test:
  name: Frontend Tests
  runs-on: ubuntu-latest
  needs: frontend-lint
  defaults:
    run:
      working-directory: todo-frontend
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '22', cache: 'npm', cache-dependency-path: 'todo-frontend/package-lock.json' }
    - run: npm ci
    - run: npm run test

frontend-docker:
  name: Frontend Docker Build
  runs-on: ubuntu-latest
  needs: frontend-test
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v4
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - uses: docker/build-push-action@v5
      with:
        context: ./todo-frontend
        target: production
        push: true
        tags: ghcr.io/${{ github.repository }}/todo-frontend:latest
```

---

## Port Allocation

| Service | Host Port | Container Port | Protocol |
|---|---|---|---|
| `db` | 5432 | 5432 | PostgreSQL |
| `redis` | 6379 | 6379 | Redis |
| `api` | 3000 | 3000 | HTTP (Fastify) |
| `frontend` | 5173 | 5173 | HTTP (Vite dev) |
| `frontend` (prod) | 80 | 80 | HTTP (Nginx) |

---

## `.dockerignore` — `todo-frontend/.dockerignore`

```
node_modules
dist
.env.local
.env.development.local
coverage
.nyc_output
*.md
.git
.gitignore
```
