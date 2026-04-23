# NFR Requirements Plan — UNIT-02: Backend Auth & User Management

## Context
Most tech decisions are inherited from UNIT-01. This plan covers only auth-specific NFRs where
user input changes the design. All UNIT-01 decisions (Node 22, PostgreSQL 17, Redis 7, Vitest,
bcryptjs rounds 12, GitHub Actions) apply unchanged.

## Plan Checklist
- [x] Read functional design artifacts for UNIT-02
- [x] Confirmed inherited decisions from UNIT-01
- [x] Identified auth-specific NFR ambiguities (3 questions)
- [x] Questions answered by user
- [x] NFR requirements artifacts generated
- [x] Artifacts approved

---

## Questions — Please Fill in Every `[Answer]:` Tag

### Q1 — Concurrent Sessions
When a user logs in from a second device (or browser), should their previous sessions remain
active?

- **Unlimited sessions**: Each login creates a new refresh token; all existing sessions remain
  valid. A user can be logged in on phone, laptop, and tablet simultaneously.
- **Single active session**: A new login revokes all previous refresh tokens for that user. Only
  the most recent session is valid (simpler security model, but logs out other devices).

- A — Unlimited concurrent sessions (recommended for multi-device UX — aligns with Jordan persona
      using multiple devices)
- B — Single active session — new login invalidates all previous refresh tokens for that user

[Answer]: A

---

### Q2 — Auth Event Audit Logging
Should login, logout, and failed login attempts be written to the structured log with
security-relevant context (SECURITY-02, SECURITY-13)?

- A — Yes — log all auth events at `info` level with `{ userId?, email, ip, userAgent, event,
      success }` fields. Failed attempts logged at `warn`. This enables security monitoring and
      incident investigation. (recommended)
- B — Minimal — log only server errors (5xx) at `error` level; no per-event auth logging

[Answer]:A

---

### Q3 — Refresh Token Max Lifetime on Inactivity
Currently refresh tokens expire after 7 days regardless of usage (fixed TTL). An alternative is
a sliding window — each successful use of `/auth/refresh` resets the TTL, keeping active users
logged in indefinitely while idle users are logged out.

- A — Fixed TTL only: refresh token always expires 7 days from issuance, regardless of activity
      (simpler — the current design)
- B — Sliding TTL: each token rotation resets the TTL to 7 days from the rotation time (users
      who log in daily are never logged out)

[Answer]:A
