import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useRegisterMutation } from '@/store/api/authApi'
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

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [register, { isLoading }] = useRegisterMutation()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register({ email: values.email, password: values.password }).unwrap()
      navigate('/')
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 409) {
        dispatch(
          addToast({
            title: 'Email already registered',
            description: 'An account with this email already exists. Try logging in.',
            variant: 'destructive',
          })
        )
        form.setValue('password', '')
        form.setValue('confirmPassword', '')
      } else if (status === 429) {
        dispatch(
          addToast({
            title: 'Too many attempts',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive',
          })
        )
      } else {
        dispatch(
          addToast({
            title: 'Registration failed',
            description: 'Something went wrong. Please try again.',
            variant: 'destructive',
          })
        )
      }
    }
  }

  return (
    <Card data-testid="register-form-card">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="register-form"
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
                      data-testid="register-form-email-input"
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
                      autoComplete="new-password"
                      data-testid="register-form-password-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      data-testid="register-form-confirm-password-input"
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
              data-testid="register-form-submit-button"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="underline hover:text-foreground"
            data-testid="register-form-login-link"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
