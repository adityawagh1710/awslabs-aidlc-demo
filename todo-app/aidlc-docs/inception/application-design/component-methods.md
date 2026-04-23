# Component Methods — TODO List App

Method signatures are TypeScript. Detailed business rules are defined in Functional Design (Construction phase).

---

## Backend: Controllers

### AuthController
```typescript
// POST /api/v1/auth/register
register(request: FastifyRequest<{ Body: RegisterRequestBody }>, reply: FastifyReply): Promise<void>

// POST /api/v1/auth/login
login(request: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply): Promise<void>

// POST /api/v1/auth/logout  (requires AuthPlugin)
logout(request: AuthenticatedRequest, reply: FastifyReply): Promise<void>
```

### TaskController
```typescript
// GET /api/v1/tasks
listTasks(request: AuthenticatedRequest<{ Querystring: TaskListQuery }>, reply: FastifyReply): Promise<void>

// POST /api/v1/tasks
createTask(request: AuthenticatedRequest<{ Body: CreateTaskBody }>, reply: FastifyReply): Promise<void>

// GET /api/v1/tasks/:id
getTask(request: AuthenticatedRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>

// PUT /api/v1/tasks/:id
updateTask(request: AuthenticatedRequest<{ Params: { id: string }; Body: UpdateTaskBody }>, reply: FastifyReply): Promise<void>

// DELETE /api/v1/tasks/:id
deleteTask(request: AuthenticatedRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>
```

### CategoryController
```typescript
// GET /api/v1/categories
listCategories(request: AuthenticatedRequest, reply: FastifyReply): Promise<void>

// POST /api/v1/categories
createCategory(request: AuthenticatedRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply): Promise<void>

// PUT /api/v1/categories/:id
updateCategory(request: AuthenticatedRequest<{ Params: { id: string }; Body: UpdateCategoryBody }>, reply: FastifyReply): Promise<void>

// DELETE /api/v1/categories/:id
deleteCategory(request: AuthenticatedRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>
```

---

## Backend: Services

### AuthService
```typescript
register(input: { email: string; password: string }): Promise<{ user: User; token: string }>
login(input: { email: string; password: string }): Promise<{ user: User; token: string }>
logout(tokenId: string): Promise<void>
```

### TaskService
```typescript
listTasks(userId: string, filters: TaskFilters, pagination: PaginationInput): Promise<PaginatedResult<Task>>
getTask(taskId: string, userId: string): Promise<Task>           // throws ForbiddenError or NotFoundError
createTask(userId: string, input: CreateTaskInput): Promise<Task>
updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<Task>
deleteTask(taskId: string, userId: string): Promise<void>
toggleCompletion(taskId: string, userId: string): Promise<Task>
```

### CategoryService
```typescript
listCategories(userId: string): Promise<Category[]>
createCategory(userId: string, input: { name: string }): Promise<Category>
updateCategory(categoryId: string, userId: string, input: { name: string }): Promise<Category>
deleteCategory(categoryId: string, userId: string): Promise<void>  // disassociates tasks; does not delete them
```

### UserService
```typescript
findById(userId: string): Promise<User | null>
findByEmail(email: string): Promise<User | null>
create(input: { email: string; passwordHash: string }): Promise<User>
```

### TokenService
```typescript
sign(payload: TokenPayload): string                     // returns signed JWT
verify(token: string): TokenPayload                     // throws if invalid/expired
invalidate(jti: string, expiresAt: Date): Promise<void> // adds jti to blacklist
isBlacklisted(jti: string): Promise<boolean>
```

---

## Backend: Repositories

### UserRepository
```typescript
findById(id: string): Promise<User | null>
findByEmail(email: string): Promise<User | null>
create(data: CreateUserData): Promise<User>
```

### TaskRepository
```typescript
findAll(userId: string, filters: TaskFilters, pagination: PaginationInput): Promise<{ tasks: Task[]; total: number }>
findById(id: string): Promise<Task | null>
create(data: CreateTaskData): Promise<Task>
update(id: string, data: UpdateTaskData): Promise<Task>
delete(id: string): Promise<void>
```

### CategoryRepository
```typescript
findAllByUser(userId: string): Promise<Category[]>
findById(id: string): Promise<Category | null>
findByNameAndUser(name: string, userId: string): Promise<Category | null>
create(data: CreateCategoryData): Promise<Category>
update(id: string, data: UpdateCategoryData): Promise<Category>
delete(id: string): Promise<void>
```

### TaskCategoryRepository
```typescript
setCategories(taskId: string, categoryIds: string[]): Promise<void>   // replaces all associations atomically
findCategoriesForTask(taskId: string): Promise<Category[]>
removeAllForCategory(categoryId: string): Promise<void>               // called on category delete
```

### TokenBlacklistRepository
```typescript
add(jti: string, expiresAt: Date): Promise<void>
isBlacklisted(jti: string): Promise<boolean>
pruneExpired(): Promise<void>   // periodic cleanup job
```

---

## Backend: Supporting Types

```typescript
interface TaskFilters {
  status?: 'active' | 'completed' | 'all'
  priority?: Array<'Low' | 'Medium' | 'High'>
  categoryIds?: string[]
  dueDateFrom?: Date
  dueDateTo?: Date
  search?: string
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

interface PaginationInput {
  page: number      // 1-based
  pageSize: number  // default 25
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface TokenPayload {
  sub: string   // userId
  jti: string   // unique token ID (for blacklisting)
  iat: number
  exp: number
  iss: string
  aud: string
}

// Passed on every authenticated request by AuthPlugin
interface AuthenticatedRequest<T = {}> extends FastifyRequest<T> {
  user: { id: string; email: string }
}
```

---

## Frontend: Redux Store

### authSlice actions
```typescript
setCredentials(state, action: PayloadAction<{ token: string; user: { id: string; email: string } }>): void
clearCredentials(state): void
```

### uiSlice actions
```typescript
setSearchQuery(state, action: PayloadAction<string>): void
setFilters(state, action: PayloadAction<Partial<TaskFilters>>): void
clearFilters(state): void
setSortOrder(state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>): void
setCurrentPage(state, action: PayloadAction<number>): void
```

### tasksApi endpoints (RTK Query — auto-generates hooks)
```typescript
getTasks(filters: TaskFilters & PaginationInput): PaginatedResult<TaskDTO>
getTaskById(id: string): TaskDTO
createTask(body: CreateTaskBody): TaskDTO
updateTask({ id: string } & UpdateTaskBody): TaskDTO
deleteTask(id: string): void
toggleTaskCompletion(id: string): TaskDTO
```

### categoriesApi endpoints
```typescript
getCategories(): CategoryDTO[]
createCategory(body: { name: string }): CategoryDTO
updateCategory({ id: string; name: string }): CategoryDTO
deleteCategory(id: string): void
```

### authApi endpoints
```typescript
login(body: { email: string; password: string }): { token: string; user: UserDTO }
register(body: { email: string; password: string }): { token: string; user: UserDTO }
logout(): void
```

---

## Frontend: Key Component Props

### TaskCard
```typescript
interface TaskCardProps {
  task: TaskDTO
  onToggleComplete: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}
```

### TaskForm
```typescript
interface TaskFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<TaskDTO>
  onSubmit: (values: CreateTaskBody | UpdateTaskBody) => Promise<void>
  isSubmitting: boolean
}
```

### ConfirmDialog
```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}
```

### EmptyState
```typescript
interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}
```

### Pagination
```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}
```
