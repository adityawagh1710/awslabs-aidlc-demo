# Logical Components — UNIT-04: Backend Task CRUD & Categories

## Component Map

```
src/
├── utils/
│   └── sanitize.ts                  ← Pattern 16 (he.encode wrapper)
├── routes/
│   ├── tasks.routes.ts              ← Route registration + AJV schemas
│   └── categories.routes.ts
├── controllers/
│   ├── tasks.controller.ts          ← HTTP adapter; extracts userId from JWT
│   └── categories.controller.ts
├── services/
│   ├── task.service.ts              ← Business logic: CRUD, IDOR, completedAt, isOverdue, validation
│   ├── category.service.ts          ← Business logic: CRUD, IDOR, citext uniqueness check
│   └── category-validation.service.ts  ← Pattern 18 (batch ownership guard)
├── repositories/
│   ├── task.repository.ts           ← Prisma: findAll (Pattern 20), findById, create, update, delete
│   ├── category.repository.ts       ← Prisma: findAllByUser, findById, findByNameAndUser, create, update, delete
│   └── task-category.repository.ts  ← Prisma: setCategories (Pattern 21), findCategoriesForTask, removeAllForCategory
└── domain/
    └── errors.ts                    ← NotFoundError, ForbiddenError (existing), ValidationError (extend)
```

---

## Component Responsibilities

### `sanitize.ts` (utility)
- `sanitizeText(value: string): string` — `he.encode(value)`
- `sanitizeTextOrNull(value: string | null | undefined): string | null`
- No external dependencies beyond `he`

### `tasks.routes.ts`
- Registers all task routes with Fastify schemas (AJV)
- Applies `authenticate` preHandler from AuthPlugin on all routes
- Routes: GET `/tasks`, POST `/tasks`, GET `/tasks/:id`, PUT `/tasks/:id`, DELETE `/tasks/:id`, PATCH `/tasks/:id/toggle`
- AJV schemas enforce: title maxLength 255, description maxLength 2000, priority enum, dueDate format, categoryIds maxItems 10

### `categories.routes.ts`
- Routes: GET `/categories`, POST `/categories`, PUT `/categories/:id`, DELETE `/categories/:id`
- AJV schema enforces: name maxLength 50

### `TaskController`
- Extracts `userId = request.user.sub` from JWT
- Delegates to `TaskService` with parsed input
- Maps service result to HTTP response (201/200/204)
- No business logic

### `CategoryController`
- Extracts `userId = request.user.sub`
- Delegates to `CategoryService`
- Maps service result to HTTP response

### `TaskService`
Key responsibilities per operation:
- **createTask**: sanitize inputs → validate dueDate timezone (Pattern 17) → validate categories (Pattern 18) → create → setCategories → toTaskDTO
- **listTasks**: query with sort → map to DTOs with isOverdue (Pattern 22)
- **getTask**: findById → IDOR check → toTaskDTO
- **updateTask**: findById → IDOR check → sanitize → validate dueDate → validate categories → partial update → setCategories if provided → toTaskDTO
- **deleteTask**: findById → IDOR check → transaction delete
- **toggleCompletion**: findById → IDOR check → write-once completedAt (Pattern 19) → update → toTaskDTO

### `CategoryService`
Key responsibilities:
- **listCategories**: findAllByUser → return DTOs
- **createCategory**: sanitize name → findByNameAndUser (citext — case-insensitive) → create
- **updateCategory**: findById → IDOR check → sanitize name → findByNameAndUser excluding self → update
- **deleteCategory**: findById → IDOR check → transaction (removeAllForCategory + delete)

### `CategoryValidationService`
- `validateOwnership(categoryIds: string[], userId: string): Promise<string[]>`
- Single `SELECT id FROM categories WHERE id IN (...) AND userId = ?`
- Returns array of IDs that were not found or not owned (empty = all valid)
- Used exclusively by `TaskService`

### `TaskRepository`
- `findAll(userId, sort)`: Prisma `orderBy` with `nulls: 'last'` support (Pattern 20)
- `findById(id)`: includes `categories` relation
- `create(data)`: Prisma create
- `update(id, data)`: Prisma update with conditional `completedAt` (Pattern 19)
- `delete(id)`: inside transaction called by TaskService

### `CategoryRepository`
- `findAllByUser(userId)`: ordered by `name ASC`
- `findById(id)`
- `findByNameAndUser(name, userId)`: Prisma `findFirst` — citext column handles case-insensitive match automatically
- `create(data)`: Prisma create
- `update(id, data)`: Prisma update
- `delete(id)`: inside transaction called by CategoryService

### `TaskCategoryRepository`
- `setCategories(taskId, categoryIds)`: `$transaction([deleteMany, createMany])` (Pattern 21)
- `findCategoriesForTask(taskId)`: join query
- `removeAllForCategory(categoryId)`: `deleteMany({ where: { categoryId } })` — inside CategoryService transaction

---

## Request Flow — Create Task

```
POST /api/v1/tasks
    │
    ▼
AuthPlugin.authenticate (preHandler)
    │  JWT → request.user.sub = userId
    ▼
AJV schema validation
    │  title, priority, dueDate, timezone, categoryIds validated
    ▼
TaskController.createTask
    │  extracts userId from request.user.sub
    ▼
TaskService.createTask(userId, input)
    │
    ├── sanitizeText(title), sanitizeTextOrNull(description)          [Pattern 16]
    ├── validateDueDate(dueDate, timezone)                             [Pattern 17]
    ├── CategoryValidationService.validateOwnership(categoryIds, userId) [Pattern 18]
    │       └── any invalid → throw ValidationError → 400
    ├── TaskRepository.create({ userId, title, description, priority, dueDate })
    ├── TaskCategoryRepository.setCategories(taskId, categoryIds)      [Pattern 21]
    └── toTaskDTO(task, new Date())                                    [Pattern 22]
    │
    ▼
TaskController → reply.status(201).send(taskDTO)
```

## Request Flow — Toggle Completion

```
PATCH /api/v1/tasks/:id/toggle
    │
    ▼
AuthPlugin.authenticate → userId
    │
    ▼
TaskController.toggleTask
    │
    ▼
TaskService.toggleCompletion(taskId, userId)
    │
    ├── TaskRepository.findById(taskId)
    │       └── null → throw NotFoundError → 404
    ├── task.userId !== userId → throw ForbiddenError → 403         [Pattern 14]
    ├── newCompleted = !task.completed
    ├── completedAt logic:                                           [Pattern 19]
    │       newCompleted=true  + task.completedAt=null → set completedAt=now
    │       newCompleted=true  + task.completedAt≠null → leave unchanged
    │       newCompleted=false → leave completedAt unchanged
    ├── TaskRepository.update(taskId, { completed: newCompleted, completedAt? })
    └── toTaskDTO(updatedTask, new Date())
    │
    ▼
reply.status(200).send(taskDTO)
```

## Request Flow — Delete Category

```
DELETE /api/v1/categories/:id
    │
    ▼
AuthPlugin.authenticate → userId
    │
    ▼
CategoryController.deleteCategory
    │
    ▼
CategoryService.deleteCategory(categoryId, userId)
    │
    ├── CategoryRepository.findById(categoryId)
    │       └── null → throw NotFoundError → 404
    ├── category.userId !== userId → throw ForbiddenError → 403
    └── prisma.$transaction([
          TaskCategoryRepository.removeAllForCategory(categoryId),
          CategoryRepository.delete(categoryId)
        ])
    │
    ▼
reply.status(204).send()
```

---

## Component Wiring (constructor injection)

```
TaskController
  └── TaskService
        ├── TaskRepository (prisma)
        ├── TaskCategoryRepository (prisma)
        └── CategoryValidationService
              └── CategoryRepository (prisma)

CategoryController
  └── CategoryService
        └── CategoryRepository (prisma)
```

All components receive dependencies via constructor — testable without Fastify instance.
`prisma` client is a singleton instantiated in `app.ts` and passed down.
