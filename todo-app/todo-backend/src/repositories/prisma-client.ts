import { PrismaClient } from '@prisma/client'

import { env } from '../config/env'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.NODE_ENV === 'test' ? env.DATABASE_URL_TEST : env.DATABASE_URL,
    },
  },
  log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
})
