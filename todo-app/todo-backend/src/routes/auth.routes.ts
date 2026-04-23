import type { FastifyInstance, RouteHandlerMethod } from 'fastify'

import { env } from '../config/env'
import { prisma } from '../repositories/prisma-client'
import { UserRepository } from '../repositories/user.repository'
import { UserService } from '../services/user.service'
import { TokenService } from '../services/token.service'
import { BruteForceService } from '../services/brute-force.service'
import { AuthService } from '../services/auth.service'
import { AuthController } from '../controllers/auth.controller'

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      password: { type: 'string', minLength: 8, maxLength: 128 },
    },
  },
} as const

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      password: { type: 'string', minLength: 1, maxLength: 128 },
    },
  },
} as const

const refreshSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    additionalProperties: false,
    properties: {
      refreshToken: { type: 'string', minLength: 1 },
    },
  },
} as const

const logoutSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      refreshToken: { type: 'string', minLength: 1 },
    },
  },
} as const

const rateLimitOverride = {
  config: {
    rateLimit: {
      max: env.NODE_ENV === 'production' ? 10 : 10000,
      timeWindow: '15 minutes',
    },
  },
}

async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const userRepo = new UserRepository(prisma)
  new UserService(userRepo)
  const tokenService = new TokenService(fastify)
  const bruteForceService = new BruteForceService(fastify.redis)
  const authService = new AuthService(userRepo, tokenService, bruteForceService, fastify.log)
  const authController = new AuthController(authService)

  fastify.post(
    '/register',
    { schema: registerSchema, ...rateLimitOverride },
    authController.register.bind(authController),
  )

  fastify.post(
    '/login',
    { schema: loginSchema, ...rateLimitOverride },
    authController.login.bind(authController),
  )

  fastify.post(
    '/refresh',
    { schema: refreshSchema, ...rateLimitOverride },
    authController.refresh.bind(authController),
  )

  fastify.post(
    '/logout',
    {
      schema: logoutSchema,
      preHandler: [fastify.authenticate],
      ...rateLimitOverride,
    },
    authController.logout.bind(authController) as RouteHandlerMethod,
  )

  // Beacon logout — called by navigator.sendBeacon on window close.
  // No Authorization header; access token passed in body.
  fastify.post(
    '/logout-beacon',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            accessToken: { type: 'string', minLength: 1 },
            refreshToken: { type: 'string', minLength: 1 },
          },
        },
      },
    },
     
    authController.logoutBeacon.bind(authController) as RouteHandlerMethod,
  )
}

export default authRoutes
