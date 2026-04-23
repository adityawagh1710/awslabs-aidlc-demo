// ── Request types ──────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken?: string
}

// ── Response types ─────────────────────────────────────────────────────────────

export interface UserDto {
  id: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserDto
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

// ── Error response ─────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number
  error: string
  message: string
}

// ── Task types ─────────────────────────────────────────────────────────────────

export type Priority = 'Low' | 'Medium' | 'High'

export interface CategoryDto {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface TaskDto {
  id: string
  title: string
  description: string | null
  priority: Priority
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  isOverdue: boolean
  categories: CategoryDto[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedTasksDto {
  items: TaskDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  timezone?: string
  categoryIds?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string | null
  priority?: Priority
  dueDate?: string | null
  timezone?: string
  categoryIds?: string[]
  completed?: boolean
}

export interface CreateCategoryRequest {
  name: string
}

export interface UpdateCategoryRequest {
  name: string
}
