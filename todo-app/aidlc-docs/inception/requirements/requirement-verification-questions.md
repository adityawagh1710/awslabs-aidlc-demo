# Requirements Clarification Questions — TODO List App

Please answer each question by filling in the letter choice after the `[Answer]:` tag.
If none of the options match your needs, choose the last option (Other) and describe your preference.
Let me know when you're done.

---

## Question 1
What type of application should this be?

A) Web application (runs in browser)
B) Command-line interface (CLI / terminal app)
C) Desktop application (native GUI)
D) Mobile application (iOS/Android)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
What programming language or tech stack do you prefer?

A) JavaScript / TypeScript (Node.js + React / Vue / plain HTML)
B) Python (Flask / FastAPI / Django, or CLI)
C) Java (Spring Boot)
D) Go
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
What core features should the TODO app have?

A) Basic CRUD only — create, read, update, delete tasks
B) CRUD + categories/tags + due dates
C) CRUD + categories/tags + due dates + priorities + search/filter
D) Full-featured — all of the above plus user accounts and authentication
X) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 4
Should tasks persist between sessions (i.e., saved to storage)?

A) Yes — persist to a database (e.g., SQLite, PostgreSQL, MongoDB)
B) Yes — persist to a local file (e.g., JSON or CSV)
C) No — in-memory only (data lost on restart; suitable for demos/PoCs)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
Who will use this application?

A) Single user only (personal tool, no accounts needed)
B) Multiple users — each with their own account and private task lists
C) Multiple users — shared task lists with collaboration features
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 6
What is the primary goal for this project?

A) Learning / personal project (quality standards are flexible)
B) Proof of concept / prototype (speed over polish)
C) Production-ready application (security, tests, maintainability required)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7 — Security Extension
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8 — Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
