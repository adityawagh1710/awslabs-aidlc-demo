# Domain Entities — UNIT-04: Backend Task CRUD & Categories

## Core Domain Types

### Task (DB model)

```typescript
interface Task {
  id: string           // UUID, PK
  userId: string       // FK → User.id, set server-side from JWT
  title: string        // max 255, HTML-escaped
  description: string | null  // max 2000, HTML-escaped
  priority: 'Low' | 'Medium' | 'High'  // default 'Medium'
  dueDate: Date | null             // UTC midnight of the selected date
  completed: boolean               // default false
  completedAt: Date | null         // write-once: first time completed; never cleared
  createdAt: Date
  updatedAt: Date
  categories: Category[]           // populated via task_category join on read
}
```

### Category (DB model)

```typescript
interface Category {
  id: string
  userId: string       // FK → User.id
  name: string         // max 50, HTML-escaped; unique per user case-insensitively
  createdAt: Date
  updatedAt: Date
}
```

### TaskCategory (join table — no entity class needed)

```typescript
// Prisma model only — no standalone domain object
// taskId FK → Task.id
// categoryId FK → Category.id
// @@unique([taskId, categoryId])
```

---

## Response DTOs

### TaskDTO

```typescript
interface TaskDTO {
  id: string
  title: string
  description: string | null
  priority: 'Low' | 'Medium' | 'High'
  dueDate: string | null      // ISO date string 'YYYY-MM-DD' or null
  completed: boolean
  completedAt: string | null  // ISO datetime string or null
  isOverdue: boolean          // computed server-side at request time (UTC)
  categories: CategoryDTO[]
  createdAt: string           // ISO datetime string
  updatedAt: string           // ISO datetime string
}
```

### CategoryDTO

```typescript
interface CategoryDTO {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
```

### Paginated list response (used for GET /api/v1/tasks)

```typescript
interface PaginatedTasksDTO {
  items: TaskDTO[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
// UNIT-04 returns all tasks (no real pagination yet):
// page=1, pageSize=total, totalPages=1
// UNIT-06 will add query param support to paginate this response
```

---

## Request Body Types

### CreateTaskBody

```typescript
interface CreateTaskBody {
  title: string                              // required
  description?: string                       // optional
  priority?: 'Low' | 'Medium' | 'High'      // optional; default 'Medium'
  dueDate?: string                           // optional; ISO date 'YYYY-MM-DD'
  timezone?: string                          // required when dueDate is provided; IANA tz
  categoryIds?: string[]                     // optional; max 10; all must be owned by user
}
```

### UpdateTaskBody

```typescript
interface UpdateTaskBody {
  title?: string
  description?: string | null               // null explicitly clears description
  priority?: 'Low' | 'Medium' | 'High'
  dueDate?: string | null                   // null explicitly clears due date
  timezone?: string                         // required when dueDate is a non-null string
  categoryIds?: string[]                    // replaces all categories atomically; max 10
  completed?: boolean                       // optional; applies toggle semantics
}
```

### CreateCategoryBody / UpdateCategoryBody

```typescript
interface CreateCategoryBody {
  name: string  // required; max 50 chars
}

interface UpdateCategoryBody {
  name: string  // required; max 50 chars
}
```

---

## Service Interfaces

### TaskService

```typescript
interface TaskService {
  listTasks(userId: string, sort: TaskSortInput): Promise<PaginatedResult<Task>>
  getTask(taskId: string, userId: string): Promise<Task>
  createTask(userId: string, input: CreateTaskInput): Promise<Task>
  updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<Task>
  deleteTask(taskId: string, userId: string): Promise<void>
  toggleCompletion(taskId: string, userId: string): Promise<Task>
}

interface TaskSortInput {
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

interface CreateTaskInput {
  title: string
  description?: string
  priority: 'Low' | 'Medium' | 'High'
  dueDate?: Date                    // already parsed + validated from request body
  categoryIds?: string[]
}

interface UpdateTaskInput {
  title?: string
  description?: string | null
  priority?: 'Low' | 'Medium' | 'High'
  dueDate?: Date | null
  categoryIds?: string[]
  completed?: boolean
}
```

### CategoryService

```typescript
interface CategoryService {
  listCategories(userId: string): Promise<Category[]>
  createCategory(userId: string, input: { name: string }): Promise<Category>
  updateCategory(categoryId: string, userId: string, input: { name: string }): Promise<Category>
  deleteCategory(categoryId: string, userId: string): Promise<void>
}
```

### CategoryValidationService (helper used by TaskService)

```typescript
interface CategoryValidationService {
  // Validates that all categoryIds exist and belong to userId.
  // Returns list of invalid IDs (empty array = all valid).
  validateOwnership(categoryIds: string[], userId: string): Promise<string[]>
}
```

---

## API Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/v1/tasks | Required | List all tasks (basic sort, no filter/pagination) |
| POST | /api/v1/tasks | Required | Create a task |
| GET | /api/v1/tasks/:id | Required | Get task by ID |
| PUT | /api/v1/tasks/:id | Required | Update task (all fields optional) |
| DELETE | /api/v1/tasks/:id | Required | Delete task |
| PATCH | /api/v1/tasks/:id/toggle | Required | Toggle task completion |
| GET | /api/v1/categories | Required | List all user's categories |
| POST | /api/v1/categories | Required | Create a category |
| PUT | /api/v1/categories/:id | Required | Update a category |
| DELETE | /api/v1/categories/:id | Required | Delete a category |

---

## Key Design Decisions (from Q&A)

| Decision | Choice | Impact |
|---|---|---|
| Due date timezone (Q1:B) | User's IANA timezone supplied in request | `timezone` field required alongside `dueDate` in request body |
| isOverdue (Q2:A) | Server-computed, returned in DTO | `isOverdue: boolean` on every TaskDTO; computed in UTC at request time |
| completedAt (Q3:A) | Write-once (first completion only) | `completedAt` never cleared on reopen; never updated on re-completion |
| Category uniqueness (Q4:A) | Case-insensitive per user | Repository uses `LOWER(name)` comparison; DB index on `lower(name), userId` |
| Null due date sort (Q5:A) | NULLS LAST | `ORDER BY dueDate ASC NULLS LAST` in all task list queries |
| Invalid categoryIds (Q6:C) | 400 with field-level listing | Whole request rejected; each bad ID listed in error response |
| Max categories (Q7:B) | 10 per task | Validated at service layer before DB write |
| Toggle endpoint (Q8:C) | Both PATCH /toggle AND PUT body | Two surfaces; same underlying completedAt write-once logic |
