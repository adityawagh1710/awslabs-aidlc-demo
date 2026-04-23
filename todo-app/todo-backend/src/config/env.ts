import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_TEST: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_ISSUER: z.string().default('todo-api'),
  JWT_AUDIENCE: z.string().default('todo-client'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(20).default(12),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Invalid environment variables:')
  for (const [field, errors] of Object.entries(result.error.flatten().fieldErrors)) {
    console.error(`  ${field}: ${errors?.join(', ')}`)
  }
  process.exit(1)
}

export const env = result.data
export type Env = typeof env
