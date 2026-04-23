import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
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
      await login(values).unwrap()
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
    <Card data-testid="login-form-card">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
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
              className="w-full"
              disabled={isLoading}
              data-testid="login-form-submit-button"
            >
              {isLoading ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="underline hover:text-foreground"
            data-testid="login-form-register-link"
          >
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
