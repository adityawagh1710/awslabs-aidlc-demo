# Build Instructions — TODO List App

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | >= 22 (use `.nvmrc`) |
| Docker | >= 24 |
| Docker Compose | >= 2.20 |
| npm | >= 10 |

### Required environment variables

Copy and fill in both `.env.example` files before building:

```bash
cp todo-backend/.env.example todo-backend/.env
cp todo-frontend/.env.example todo-frontend/.env
```

Minimum required values in `todo-backend/.env`:

```
DATABASE_URL=postgresql://todo_app:changeme@localhost:5432/todo
REDIS_URL=redis://localhost:6379
JWT_SECRET=<at-least-32-character-random-string>
JWT_EXPIRES_IN=15m
JWT_ISSUER=todo-api
JWT_AUDIENCE=todo-client
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
BCRYPT_ROUNDS=12
PORT=3000
```

---

## Build Steps

### 1. Install dependencies

```bash
# Backend
cd todo-backend && npm ci

# Frontend
cd todo-frontend && npm ci
```

### 2. Generate Prisma client

```bash
cd todo-backend
npx prisma generate
```

### 3. Start infrastructure (PostgreSQL + Redis)

```bash
cd todo-backend
docker compose up db redis -d
```

Wait for both services to be healthy (usually ~10 seconds):

```bash
docker compose ps   # both should show "healthy"
```

### 4. Run database migrations

```bash
cd todo-backend
npx prisma migrate deploy
```

### 5. Build backend (TypeScript → JavaScript)

```bash
cd todo-backend
npm run build
```

Expected output: `dist/` directory created, no TypeScript errors.

### 6. Build frontend (Vite production bundle)

```bash
cd todo-frontend
npm run build
```

Expected output: `dist/` directory created, bundle size warnings only if chunks exceed 200 KB.

### 7. Type-check both repos

```bash
cd todo-backend && npm run type-check
cd todo-frontend && npm run type-check
```

Both should exit with code 0.

### 8. Lint both repos

```bash
cd todo-backend && npm run lint
cd todo-frontend && npm run lint
```

Both should exit with code 0 (zero warnings allowed).

---

## Build Artifacts

| Artifact | Location |
|---|---|
| Backend compiled JS | `todo-backend/dist/` |
| Frontend static bundle | `todo-frontend/dist/` |
| Prisma client | `todo-backend/node_modules/.prisma/client/` |

---

## Docker build (production images)

```bash
# Backend
docker build -t todo-backend:local --target production todo-backend/

# Frontend
docker build -t todo-frontend:local --target production todo-frontend/
```

---

## Troubleshooting

### `prisma generate` fails
- Ensure `DATABASE_URL` is set in `.env`
- Run `npm ci` first to ensure `@prisma/client` is installed

### TypeScript errors after pulling changes
- Run `npm ci` to pick up any new dependencies
- Run `npx prisma generate` if schema changed

### Port conflicts
- Backend default: `3000` — change `PORT` in `.env`
- Frontend dev: `5173` — change in `vite.config.ts`
- PostgreSQL: `5432` — change in `docker-compose.yml`
- Redis: `6379` — change in `docker-compose.yml`
