# Infrastructure Design — UNIT-01: DB & Infrastructure Foundation

## Local Development Stack

All services run via a single `docker compose up --build` from `todo-backend/`.

### Service Topology

```
┌─────────────────────────────────────────────────────────┐
│  Docker network: todo-net (bridge)                      │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐  ┌─────────────┐  │
│  │  db          │   │  redis       │  │  api        │  │
│  │  postgres:17 │   │  redis:7     │  │  Node 22    │  │
│  │  port 5432   │   │  port 6379   │  │  port 3000  │  │
│  │  volume:     │   │  no persist  │  │             │  │
│  │  pgdata      │   │  (dev only)  │  │ depends_on: │  │
│  └──────────────┘   └──────────────┘  │  db healthy │  │
│                                       │  redis hlthy│  │
│                                       └─────────────┘  │
└─────────────────────────────────────────────────────────┘

Host-exposed ports (development only):
  localhost:5432  → db
  localhost:6379  → redis
  localhost:3000  → api
```

### Docker Compose Services

#### `db` — PostgreSQL 17
| Setting | Value |
|---|---|
| Image | `postgres:17-alpine` |
| Database | `todo` |
| User | `todo_app` |
| Password | `${POSTGRES_PASSWORD}` (from `.env`) |
| Port (host) | `5432:5432` |
| Volume | Named volume `pgdata` → `/var/lib/postgresql/data` |
| Health check | `pg_isready -U todo_app -d todo` every 5 s, 3 retries, 5 s start period |
| Network | `todo-net` |

#### `redis` — Redis 7
| Setting | Value |
|---|---|
| Image | `redis:7-alpine` |
| Port (host) | `6379:6379` |
| Persistence | None in development (data lost on container restart — blacklist resets cleanly) |
| Health check | `redis-cli ping` every 5 s, 3 retries, 3 s start period |
| Network | `todo-net` |

#### `api` — Fastify Backend
| Setting | Value |
|---|---|
| Build | `Dockerfile` target `development` (bind-mounts `src/` for hot reload) |
| Port (host) | `3000:3000` |
| Environment | Loaded from `.env` file |
| `depends_on` | `db: { condition: service_healthy }`, `redis: { condition: service_healthy }` |
| Restart | `on-failure` (exits non-zero on startup failure; Compose retries) |
| Network | `todo-net` |
| Volume (dev) | `./src:/app/src:ro` — bind-mount for `tsx watch` hot reload |

### Named Volumes
| Volume | Purpose |
|---|---|
| `pgdata` | PostgreSQL data directory — survives `docker compose down`, reset with `docker volume rm todo-backend_pgdata` |

### Networks
| Network | Driver | Purpose |
|---|---|---|
| `todo-net` | `bridge` | Isolates all services; api accesses db and redis by service name |

---

## Dockerfile — Multi-Stage Build

Three stages:

```
FROM node:22-alpine AS base
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci

FROM base AS development
  COPY . .
  CMD ["npx", "tsx", "watch", "src/server.ts"]

FROM base AS builder
  COPY . .
  RUN npm run build          # tsc → dist/

FROM node:22-alpine AS production
  WORKDIR /app
  RUN addgroup -S appgroup && adduser -S appuser -G appgroup
  COPY package*.json ./
  RUN npm ci --omit=dev
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/prisma ./prisma
  USER appuser               # non-root (SECURITY-08)
  EXPOSE 3000
  CMD ["node", "dist/server.js"]
```

Key security properties of the production stage:
- Non-root user `appuser` (SECURITY-08)
- `npm ci --omit=dev` — no devDependencies in production image
- No source TypeScript in final image — compiled JS only
- Alpine base — minimal attack surface

---

## Environment Variables — `.env` File

Local development uses `.env` (gitignored). `.env.example` is committed with placeholder values.

```dotenv
# .env.example

NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://todo_app:changeme@localhost:5432/todo
DATABASE_URL_TEST=postgresql://todo_app:changeme@localhost:5432/todo_test
POSTGRES_PASSWORD=changeme

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=replace-with-at-least-32-character-random-string
JWT_EXPIRES_IN=15m
JWT_ISSUER=todo-api
JWT_AUDIENCE=todo-client

# CORS (development — override in production)
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=12
```

Production: all vars injected via deployment environment (ECS task definition, Kubernetes secret, etc.) — never committed.

---

## Local Developer Workflow

```bash
# First time setup
cp .env.example .env
# edit .env — set POSTGRES_PASSWORD and JWT_SECRET

# Start all services
docker compose up --build

# Run database migrations (in separate terminal)
docker compose exec api npx prisma migrate dev

# Run tests (uses DATABASE_URL_TEST)
npm test

# Stop services (data preserved in pgdata volume)
docker compose down

# Reset database
docker volume rm todo-backend_pgdata
docker compose up --build
```
