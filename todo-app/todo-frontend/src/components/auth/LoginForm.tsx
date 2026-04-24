import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'

import { useLoginMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/authSlice'
import { addToast } from '@/store/uiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await login(values).unwrap()
      // Dispatch credentials synchronously before navigating so ProtectedRoute
      // sees isAuthenticated=true immediately on redirect
      dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }))
      sessionStorage.setItem('accessToken', data.accessToken)
      sessionStorage.setItem('refreshToken', data.refreshToken)
      sessionStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 429) {
        dispatch(
          addToast({
            title: 'Too many attempts',
            description: 'You have been temporarily locked out. Please try again later.',
            variant: 'destructive',
          })
        )
      } else {
        dispatch(
          addToast({
            title: 'Login failed',
            description: 'Invalid email or password.',
            variant: 'destructive',
          })
        )
      }
      // Preserve email field, clear password
      form.setValue('password', '')
    }
  }

  return (
    <Card className="shadow-xl shadow-violet-100/50 border-border/60" data-testid="login-form-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="login-form"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      data-testid="login-form-email-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      data-testid="login-form-password-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200"
              disabled={isLoading}
              data-testid="login-form-submit-button"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-violet-600 hover:text-violet-700 font-medium"
            data-testid="login-form-register-link"
          >
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
