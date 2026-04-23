import type { FastifyServerOptions } from 'fastify'

import { env } from '../config/env'

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'body.password',
  'body.token',
  '*.password',
  '*.token',
  '*.passwordHash',
]

export const loggerOptions: FastifyServerOptions['logger'] =
  env.NODE_ENV === 'development'
    ? {
        level: env.LOG_LEVEL,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        redact: REDACT_PATHS,
      }
    : {
        level: env.LOG_LEVEL,
        redact: REDACT_PATHS,
      }
