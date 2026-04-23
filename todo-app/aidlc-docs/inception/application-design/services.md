# Services — TODO List App

Service orchestration patterns and inter-service interactions.

---

## AuthService — Orchestration

### Registration Flow
```
AuthController.register()
  → UserService.findByEmail()        // check uniqueness
  → [if exists] throw ConflictError
  → bcrypt.hash(password)            // adaptive password hashing
  → UserService.create()             // persist user
  → TokenService.sign()              // issue JWT
  → return { user, token }
```

### Login Flow
```
AuthController.login()
  → UserService.findByEmail()        // look up user
  → [if not found] throw UnauthorizedError (generic message)
  → bcrypt.compare(password, hash)   // verify credential
  → [if mismatch] throw UnauthorizedError (generic message)
  → TokenService.sign()              // issue JWT (new jti each time)
  → return { user, token }
```

### Logout Flow
```
AuthController.logout()
  → AuthPlugin [preHandler]          // validates JWT, extracts jti
  → TokenService.invalidate(jti)     // add jti to blacklist until exp
  → return 204 No Content
```

---

## TaskService — Orchestration

### List Tasks Flow (with filters)
```
TaskController.listTasks()
  → AuthPlugin [preHandler]                   // verify token → request.user.id
  → TaskService.listTasks(userId, filters)
      → TaskRepository.findAll()              // parameterized query with filters/sort/pagination
      → [for each task] attach categories via JOIN or secondary query
  → return PaginatedResult<Task>
```

### Create Task Flow
```
TaskController.createTask()
  → AuthPlugin [preHandler]
  → ValidationPlugin                           // Fastify schema validates body
  → TaskService.createTask(userId, input)
      → [if categoryIds present] CategoryRepository.findById each
      → [if any category.userId !== userId] throw ForbiddenError
      → TaskRepository.create()
      → TaskCategoryRepository.setCategories()
  → return 201 with created Task
```

### Get / Update / Delete Task Flow
```
TaskController.getTask / updateTask / deleteTask()
  → AuthPlugin [preHandler]
  → TaskService.getTask / updateTask / deleteTask(taskId, userId)
      → TaskRepository.findById(taskId)
      → [if not found] throw NotFoundError
      → [if task.userId !== userId] throw ForbiddenError    // IDOR prevention
      → [update/delete] TaskRepository.update / delete()
      → [on delete] TaskCategoryRepository associations cascade-deleted by DB FK
  → return 200 / 204
```

---

## CategoryService — Orchestration

### Delete Category Flow (with task disassociation)
```
CategoryController.deleteCategory()
  → AuthPlugin [preHandler]
  → CategoryService.deleteCategory(categoryId, userId)
      → CategoryRepository.findById(categoryId)
      → [if not found] throw NotFoundError
      → [if category.userId !== userId] throw ForbiddenError
      → TaskCategoryRepository.removeAllForCategory(categoryId)  // disassociate
      → CategoryRepository.delete(categoryId)
  → return 204 No Content
```

---

## TokenService — Interaction with AuthPlugin

```
[Every protected request]
  → AuthPlugin.preHandler
      → extract Bearer token from Authorization header (or cookie)
      → TokenService.verify(token)           // validate signature + expiry
      → TokenService.isBlacklisted(jti)      // check logout state
      → [if invalid/blacklisted] reply 401
      → attach { id, email } to request.user
      → [pass to controller]
```

---

## Frontend Service Orchestration (RTK Query)

### RTK Query baseQuery with session management
```
customBaseQuery(args)
  → prepareHeaders: inject Authorization: Bearer <token> from authSlice
  → call fetchBaseQuery(args)
  → [if result.error.status === 401]
      → dispatch(clearCredentials())
      → redirect to /login with "session expired" message
  → return result
```

### Optimistic UI for task completion toggle
```
toggleTaskCompletion mutation (pessimistic update)
  → dispatch mutation
  → on success: RTK Query cache invalidation → refetch getTasks
  → on error: show Toast error notification
```

### Filter state → API query flow
```
uiSlice state change (filter/search/sort/page)
  → DashboardPage reads combined filter state from Redux
  → passes as args to useGetTasksQuery(filters)
  → RTK Query deduplicates, caches, and refetches as needed
  → TaskList renders updated results with loading state
```

---

## Cross-Service Error Mapping

| Service Error | HTTP Status | Response Body |
|---|---|---|
| `ConflictError` (email taken) | 409 Conflict | `{ "error": "Conflict", "message": "..." }` |
| `UnauthorizedError` | 401 Unauthorized | `{ "error": "Unauthorized", "message": "Invalid email or password" }` |
| `ForbiddenError` (IDOR) | 403 Forbidden | `{ "error": "Forbidden", "message": "Access denied" }` |
| `NotFoundError` | 404 Not Found | `{ "error": "NotFound", "message": "Resource not found" }` |
| `ValidationError` | 400 Bad Request | `{ "error": "ValidationError", "fields": { "field": "message" } }` |
| Unhandled error | 500 Internal Server Error | `{ "error": "InternalServerError", "message": "An unexpected error occurred" }` |

**Rule**: Error responses NEVER include stack traces, internal paths, or database details (SECURITY-09, SECURITY-15).
