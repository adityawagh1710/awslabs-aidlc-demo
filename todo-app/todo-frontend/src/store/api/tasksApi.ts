import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQueryWithReauth } from '@/store/api/apiSlice'
import { addToast } from '@/store/uiSlice'
import type {
  TaskDto,
  PaginatedTasksDto,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '@/types/api'

export interface TaskQueryArgs {
  sortBy?: string
  sortOrder?: string
  search?: string
  status?: 'active' | 'completed' | 'all'
  priority?: string[]
  categoryIds?: string[]
  dueDateFrom?: string
  dueDateTo?: string
  page?: number
  pageSize?: number
}

function serializeTaskQueryArgs(params: TaskQueryArgs): string {
  const qs = new URLSearchParams()
  if (params.sortBy) qs.set('sortBy', params.sortBy)
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder)
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  params.priority?.forEach((p) => qs.append('priority', p))
  params.categoryIds?.forEach((id) => qs.append('categoryIds', id))
  if (params.dueDateFrom) qs.set('dueDateFrom', params.dueDateFrom)
  if (params.dueDateTo) qs.set('dueDateTo', params.dueDateTo)
  if (params.page && params.page > 1) qs.set('page', String(params.page))
  if (params.pageSize && params.pageSize !== 25) qs.set('pageSize', String(params.pageSize))
  const str = qs.toString()
  return str ? `?${str}` : ''
}

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<PaginatedTasksDto, TaskQueryArgs>({
      query: (params) => `/tasks${serializeTaskQueryArgs(params)}`,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task' as const, id: 'LIST' },
            ]
          : [{ type: 'Task' as const, id: 'LIST' }],
    }),

    getTaskById: builder.query<TaskDto, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Task', id }],
    }),

    createTask: builder.mutation<TaskDto, CreateTaskRequest>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    updateTask: builder.mutation<TaskDto, { id: string } & UpdateTaskRequest>({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    deleteTask: builder.mutation<void, { id: string; queryArgs: TaskQueryArgs }>({
      query: ({ id }) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          tasksApi.util.updateQueryData('getTasks', queryArgs, (draft) => {
            draft.items = draft.items.filter((t) => t.id !== id)
            draft.total = Math.max(0, draft.total - 1)
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
          dispatch(addToast({ title: 'Failed to delete task', variant: 'destructive' }))
        }
      },
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    toggleTask: builder.mutation<TaskDto, { id: string; queryArgs: TaskQueryArgs }>({
      query: ({ id }) => ({ url: `/tasks/${id}/toggle`, method: 'PATCH' }),
      async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
        const listPatch = dispatch(
          tasksApi.util.updateQueryData('getTasks', queryArgs, (draft) => {
            const task = draft.items.find((t) => t.id === id)
            if (task) task.completed = !task.completed
          }),
        )
        const detailPatch = dispatch(
          tasksApi.util.updateQueryData('getTaskById', id, (draft) => {
            draft.completed = !draft.completed
          }),
        )
        try {
          const { data } = await queryFulfilled
          dispatch(
            tasksApi.util.updateQueryData('getTasks', queryArgs, (draft) => {
              const task = draft.items.find((t) => t.id === id)
              if (task) Object.assign(task, data)
            }),
          )
          dispatch(
            tasksApi.util.updateQueryData('getTaskById', id, (draft) => {
              Object.assign(draft, data)
            }),
          )
        } catch {
          listPatch.undo()
          detailPatch.undo()
          dispatch(addToast({ title: 'Failed to update task', variant: 'destructive' }))
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Task', id }],
    }),
  }),
})

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useToggleTaskMutation,
} = tasksApi
