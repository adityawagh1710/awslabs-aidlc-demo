# Infrastructure Design Plan — UNIT-01: DB & Infrastructure Foundation

## Context
Maps the logical components from NFR Design to concrete infrastructure artefacts:
Docker Compose topology, Dockerfile, GitHub Actions pipeline, and local dev tooling.
Production cloud deployment is out of scope for UNIT-01.

## Plan Checklist
- [x] Analysed NFR design artifacts (nfr-design-patterns.md, logical-components.md)
- [x] Identified genuine infrastructure ambiguities requiring user input (3 questions)
- [x] Questions answered by user
- [x] Infrastructure design artifacts generated
- [x] Artifacts approved

---

## Questions — Please Fill in Every `[Answer]:` Tag

### Q1 — GitHub Actions CI Job Structure
The CI pipeline runs: lint → type-check → test → docker build.

- **Single job**: All steps in one runner — fastest (shared workspace, no artifact upload between
  jobs); if lint fails, test is never reached (steps are sequential).
- **Separate jobs**: Each step is its own job — parallel visibility in the GitHub UI; lint and
  type-check can run in parallel; test and docker build wait on them. Slightly slower due to
  separate runner spin-up per job.

- A — Single job, sequential steps (recommended — simpler, fastest for a project this size)
- B — Separate jobs (lint + type-check in parallel, then test, then docker build)

[Answer]:B

---

### Q2 — PostgreSQL Local Data Persistence
Docker Compose needs to persist PostgreSQL data between `docker compose down` / `up` cycles.

- **Named volume** (recommended): Docker manages the volume (`pgdata`); survives container
  recreation; `docker volume rm todo_pgdata` to reset. Portable across machines.
- **Bind mount**: Maps a host directory (e.g., `./data/postgres`) to the container. Data is
  visible on the host filesystem; easier to inspect but creates a local directory in the repo
  (should be `.gitignore`d).

- A — Named Docker volume (`pgdata`) — recommended
- B — Bind mount to `./data/postgres` (host-visible, gitignored)

[Answer]:A

---

### Q3 — CI Docker Image: Validate Build Only vs Push to Registry
The CI pipeline will run `docker build --target production .` to validate the Dockerfile.

- **Build only** (recommended for now): CI confirms the image builds successfully but does not push
  it anywhere. No registry credentials needed in CI secrets.
- **Build and push**: CI builds and pushes the image to a container registry (e.g., GitHub
  Container Registry `ghcr.io`) on every push to `main`. Requires adding `GHCR_TOKEN` secret.

- A — Build only — validate the Dockerfile compiles; no push (recommended — simpler, no registry
      setup needed yet)
- B — Build and push to GitHub Container Registry (`ghcr.io`) on `main` branch

[Answer]:B
