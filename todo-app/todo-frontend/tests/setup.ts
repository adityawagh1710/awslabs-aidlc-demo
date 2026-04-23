import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Default MSW handlers — override per test with server.use(...)
export const handlers = [
  http.post('/api/v1/auth/register', () =>
    HttpResponse.json(
      {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: 'user-1', email: 'test@example.com', createdAt: new Date().toISOString() },
      },
      { status: 201 }
    )
  ),
  http.post('/api/v1/auth/login', () =>
    HttpResponse.json(
      {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: 'user-1', email: 'test@example.com', createdAt: new Date().toISOString() },
      },
      { status: 200 }
    )
  ),
  http.post('/api/v1/auth/refresh', () =>
    HttpResponse.json(
      { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
      { status: 200 }
    )
  ),
  http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),

  // Task handlers
  http.get('/api/v1/tasks', () =>
    HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 0, totalPages: 1 })
  ),
  http.post('/api/v1/tasks', () =>
    HttpResponse.json(
      {
        id: 'task-1', title: 'New Task', description: null, priority: 'Medium',
        dueDate: null, completed: false, completedAt: null, isOverdue: false,
        categories: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    )
  ),
  http.get('/api/v1/tasks/:id', ({ params }) =>
    HttpResponse.json({
      id: params['id'], title: 'Mock Task', description: null, priority: 'Medium',
      dueDate: null, completed: false, completedAt: null, isOverdue: false,
      categories: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  ),
  http.put('/api/v1/tasks/:id', ({ params }) =>
    HttpResponse.json({
      id: params['id'], title: 'Updated Task', description: null, priority: 'Medium',
      dueDate: null, completed: false, completedAt: null, isOverdue: false,
      categories: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  ),
  http.delete('/api/v1/tasks/:id', () => new HttpResponse(null, { status: 204 })),
  http.patch('/api/v1/tasks/:id/toggle', ({ params }) =>
    HttpResponse.json({
      id: params['id'], title: 'Mock Task', description: null, priority: 'Medium',
      dueDate: null, completed: true, completedAt: new Date().toISOString(), isOverdue: false,
      categories: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  ),

  // Category handlers
  http.get('/api/v1/categories', () => HttpResponse.json([])),
  http.post('/api/v1/categories', () =>
    HttpResponse.json(
      { id: 'cat-1', name: 'Work', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { status: 201 }
    )
  ),
  http.put('/api/v1/categories/:id', ({ params }) =>
    HttpResponse.json({
      id: params['id'], name: 'Renamed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  ),
  http.delete('/api/v1/categories/:id', () => new HttpResponse(null, { status: 204 })),
]

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
