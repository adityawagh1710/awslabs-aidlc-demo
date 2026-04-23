# NFR Design Plan — UNIT-01: DB & Infrastructure Foundation

## Context
Translate the approved NFR requirements and tech stack decisions into concrete design patterns
and logical component definitions that Code Generation will implement directly.

## Plan Checklist
- [x] Analysed NFR requirements artifacts (nfr-requirements.md, tech-stack-decisions.md)
- [x] Identified genuine design ambiguities requiring user input (3 questions)
- [x] Questions answered by user
- [x] NFR design artifacts generated
- [x] Artifacts approved

---

## Questions — Please Fill in Every `[Answer]:` Tag

### Q1 — Redis Unavailability: Fail-Closed vs Fail-Open
When the Fastify server starts but **Redis is unreachable**, the `/health` endpoint will report
unhealthy. However, for already-running instances where Redis temporarily drops:

- **Fail-closed** (secure): Any request that requires blacklist checking (i.e., every authenticated
  request) returns `503 Service Unavailable` until Redis reconnects. No authenticated request is
  served while blacklist state is uncertain.
- **Fail-open** (available): If Redis is down, assume the token is **not** blacklisted and allow
  the request. A logged-out token could be replayed during the outage window.

Security extension (SECURITY-11) favours fail-closed. Which behaviour do you want?

- A — Fail-closed: return 503 on any auth request when Redis is unreachable (recommended — aligns
      with Security Baseline)
- B — Fail-open: allow requests through with a warning log when Redis is unreachable

[Answer]:A

---

### Q2 — Server Startup: Hard-Fail vs Deferred Connection
If **PostgreSQL or Redis is not reachable** when the Fastify process starts:

- **Hard-fail** (recommended): Process exits with a non-zero code immediately. Docker Compose
  restart policy and `depends_on: condition: service_healthy` handle retries. Simpler; avoids
  partially-initialised state.
- **Deferred**: Server starts, but `/health` returns 503 until both services connect. More complex
  retry logic in the app; useful if startup ordering cannot be guaranteed.

- A — Hard-fail on startup (recommended — cleaner lifecycle, works naturally with Docker Compose
      health checks)
- B — Deferred connection with retry loop (more resilient to startup race conditions)

[Answer]:A

---

### Q3 — Development Log Format
In local development the pino JSON logs are machine-readable but hard to scan in a terminal.
`pino-pretty` transforms them into coloured, human-readable output.

- A — `pino-pretty` in development, raw JSON in production (recommended — better DX)
- B — Raw JSON in both environments (consistent, but harder to read locally)

[Answer]:A
