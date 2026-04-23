import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'

import authReducer, { clearCredentials } from '@/store/authSlice'
import uiReducer from '@/store/uiSlice'
import { authApi } from '@/store/api/authApi'
import { tasksApi } from '@/store/api/tasksApi'
import { categoriesApi } from '@/store/api/categoriesApi'

// Reset task/category caches on logout to prevent cross-user data leakage (Pattern 26)
const listenerMiddleware = createListenerMiddleware()
listenerMiddleware.startListening({
  actionCreator: clearCredentials,
  effect: (_action, { dispatch }) => {
    dispatch(tasksApi.util.resetApiState())
    dispatch(categoriesApi.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(authApi.middleware)
      .concat(tasksApi.middleware)
      .concat(categoriesApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
