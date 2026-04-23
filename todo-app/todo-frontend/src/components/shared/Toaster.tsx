import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { removeToast, selectToasts } from '@/store/uiSlice'
import { toast } from '@/components/ui/use-toast'

/**
 * Bridges Redux ui.toasts into the shadcn/ui toast system.
 * Watches the Redux toast queue and fires shadcn toasts, then removes them from Redux.
 */
export function ReduxToaster() {
  const dispatch = useAppDispatch()
  const toasts = useAppSelector(selectToasts)

  useEffect(() => {
    toasts.forEach((t) => {
      toast({
        title: t.title,
        description: t.description,
        variant: t.variant,
      })
      dispatch(removeToast(t.id))
    })
  }, [toasts, dispatch])

  return null
}
