# awslabs-aidlc-demo

AI-Driven Development Lifecycle (AI-DLC) adaptive demos — showcasing how AI agents can drive the full software development lifecycle from requirements to production-ready code.

---

## Projects

### [`todo-app/`](./todo-app)

A production-grade, full-stack **TODO List App** built entirely using the AI-DLC workflow with [Kiro](https://kiro.dev).

| | |
|---|---|
| **Frontend** | React 18 + Vite + Redux Toolkit + Tailwind CSS |
| **Backend** | Fastify 5 + TypeScript + Prisma + PostgreSQL + Redis |
| **Testing** | 128 backend tests · 98 frontend tests · 24 Cypress E2E tests |
| **CI/CD** | GitHub Actions — lint, type-check, test, Docker build & push |

**Quick start:**
```bash
cd todo-app/todo-backend
docker compose up -d --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

See [`todo-app/README.md`](./todo-app/README.md) for full documentation.

---

## What is AI-DLC?

AI-DLC (AI-Driven Development Lifecycle) is an adaptive workflow that uses AI agents to drive every phase of software development:

```
INCEPTION  →  Requirements · User Stories · Application Design · Units of Work
CONSTRUCTION  →  Functional Design · NFR Design · Code Generation · Build & Test
OPERATIONS  →  Deployment · Monitoring (placeholder)
```

The workflow is defined in `.aidlc-rule-details/` and tracked in `todo-app/aidlc-docs/`.

---

## Repository Structure

```
awslabs-aidlc-demo/
├── .github/
│   └── workflows/
│       └── ci.yml          # CI pipeline (lint, test, Docker, E2E)
├── todo-app/               # The TODO List App project
│   ├── todo-backend/       # Fastify API
│   ├── todo-frontend/      # React SPA
│   ├── aidlc-docs/         # AI-DLC design documentation & audit trail
│   ├── .aidlc-rule-details/ # AI-DLC workflow rules
│   └── README.md           # Full project documentation
└── README.md               # This file
```
