# User Personas — TODO List App

## Persona 1: Alex — The Visitor

| Attribute | Detail |
|---|---|
| **Name** | Alex |
| **Role** | Unauthenticated visitor |
| **Age Range** | 22–45 |
| **Technical Comfort** | Moderate — uses web apps and mobile apps daily, not a developer |
| **Device** | Laptop (primary), mobile (secondary) |

### Goals
- Quickly understand what the TODO app offers
- Register for an account with minimal friction
- Get started managing tasks as soon as possible

### Frustrations
- Confusing or multi-step registration flows
- Unclear error messages (e.g., "password invalid" without saying why)
- Being redirected to a login page with no explanation after an action fails
- Forms that lose their data on validation error

### Context
Alex discovers the app through a recommendation or search. They land on the homepage, decide it looks useful, and want to sign up and start using it within a few minutes. A failed registration experience will cause them to abandon the app entirely.

### Stories Alex Appears In
US-01 (Register), US-02 (Log In)

---

## Persona 2: Jordan — The Task Manager

| Attribute | Detail |
|---|---|
| **Name** | Jordan |
| **Role** | Authenticated user — primary daily user of the app |
| **Age Range** | 25–50 |
| **Technical Comfort** | Moderate — comfortable with web productivity tools, uses them professionally |
| **Device** | Laptop (primary), tablet (occasional) |

### Goals
- Capture tasks quickly so nothing is forgotten
- Organize tasks by category, priority, and due date
- Easily find specific tasks using search or filters
- Know at a glance which tasks are overdue or high priority
- Keep personal tasks private — confident no one else can see them

### Frustrations
- Tasks getting "lost" in a long, unfiltered list
- Having to scroll through all tasks to find one specific item
- Missing deadlines because there was no overdue indicator
- Slow, unresponsive UX when the task list grows large

### Context
Jordan logs in at the start of each workday, reviews overdue and high-priority tasks, adds new items throughout the day, and marks tasks complete as they finish them. They use categories to separate work, personal, and shopping tasks. They rely on due dates to plan their week.

### Stories Jordan Appears In
US-02 (Log In), US-03 (Log Out), US-04 (Session Expiry), US-05 through US-16 (all task and filter stories)

---

## Persona 3: Casey — The API Consumer

| Attribute | Detail |
|---|---|
| **Name** | Casey |
| **Role** | Developer or technical user accessing the REST API directly |
| **Age Range** | 22–40 |
| **Technical Comfort** | High — writes code, calls REST APIs regularly, reads API documentation |
| **Device** | Laptop / desktop, uses terminal and API clients (curl, Postman, custom code) |

### Goals
- Authenticate with the API securely to obtain a token
- Perform all task operations programmatically (create, update, complete, delete)
- Receive structured, predictable error responses to handle in code
- Integrate the TODO API into a custom script, mobile app, or third-party workflow tool

### Frustrations
- Inconsistent or undocumented error response formats
- Unclear authentication flows (how to refresh tokens, what happens on expiry)
- Endpoints that return different shapes for success vs. error
- API rate limiting without informative `Retry-After` headers

### Context
Casey wants to build a personal automation that syncs tasks from another tool into the TODO app. They need the API to behave predictably, return structured JSON errors, and enforce the same authorization rules as the web UI — especially that one user's token cannot access another user's tasks.

### Stories Casey Appears In
US-17 (API Authentication), US-18 (API Task Management)
