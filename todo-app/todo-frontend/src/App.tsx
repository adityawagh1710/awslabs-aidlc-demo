import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { PersistAuth } from '@/components/shared/PersistAuth'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { Toaster } from '@/components/ui/toaster'
import { ReduxToaster } from '@/components/shared/Toaster'

const TaskFormPage = React.lazy(() =>
  import('@/pages/TaskFormPage').then((m) => ({ default: m.TaskFormPage })),
)
const TaskDetailPage = React.lazy(() =>
  import('@/pages/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })),
)
const CategoryManagementPage = React.lazy(() =>
  import('@/pages/CategoryManagementPage').then((m) => ({ default: m.CategoryManagementPage })),
)

export function App() {
  return (
    <PersistAuth>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/tasks/new"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <TaskFormPage mode="create" />
                </Suspense>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <TaskDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/tasks/:id/edit"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <TaskFormPage mode="edit" />
                </Suspense>
              }
            />
            <Route
              path="/categories"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <CategoryManagementPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
      <ReduxToaster />
    </PersistAuth>
  )
}
