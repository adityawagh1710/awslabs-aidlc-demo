import bcrypt from 'bcryptjs'
import type { FastifyBaseLogger } from 'fastify'
import type { User } from '@prisma/client'

import { ConflictError, UnauthorizedError } from '../domain/errors'
import type { UserRepository } from '../repositories/user.repository'

import type { TokenService } from './token.service'
import type { BruteForceService } from './brute-force.service'

export interface UserDto {
  id: string
  email: string
  createdAt: Date
}

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: UserDto
}

function toUserDto(user: User): UserDto {
  return { id: user.id, email: user.email, createdAt: user.createdAt }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export class AuthService {
  private readonly DUMMY_HASH: string

  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService,
    private readonly bruteForceService: BruteForceService,
    private readonly log: FastifyBaseLogger,
  ) {
    this.DUMMY_HASH = bcrypt.hashSync('dummy-constant-time-hash', 12)
  }

  async register(input: { email: string; password: string }): Promise<AuthResult> {
    const email = normaliseEmail(input.email)

    const existing = await this.userRepo.findByEmail(email)
    if (existing) {
      throw new ConflictError('Email already registered')
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await this.userRepo.create({ email, passwordHash })

    const { accessToken, refreshToken, refreshJti } = this.tokenService.signPair(user.id)
    await this.tokenService.storeRefresh(refreshJti, user.id)

    this.log.info({ event: 'register', email, userId: user.id, success: true })

    return { accessToken, refreshToken, user: toUserDto(user) }
  }

  async login(input: {
    email: string
    password: string
    ip: string
    userAgent: string
  }): Promise<AuthResult> {
    const email = normaliseEmail(input.email)

    if (await this.bruteForceService.isLocked(email)) {
      this.log.warn({
        event: 'login.locked',
        email,
        ip: input.ip,
        userAgent: input.userAgent,
        success: false,
      })
      throw new UnauthorizedError('Invalid credentials')
    }

    const user = await this.userRepo.findByEmail(email)

    const hashToCompare = user ? user.passwordHash : this.DUMMY_HASH
    const valid = await bcrypt.compare(input.password, hashToCompare)

    if (!user || !valid) {
      if (user) {
        await this.bruteForceService.recordFailure(email)
      }
      this.log.warn({
        event: 'login.failure',
        email,
        ip: input.ip,
        userAgent: input.userAgent,
        success: false,
      })
      throw new UnauthorizedError('Invalid credentials')
    }

    await this.bruteForceService.reset(email)

    const { accessToken, refreshToken, refreshJti } = this.tokenService.signPair(user.id)
    await this.tokenService.storeRefresh(refreshJti, user.id)

    this.log.info({
      event: 'login.success',
      email,
      userId: user.id,
      ip: input.ip,
      userAgent: input.userAgent,
      success: true,
    })

    return { accessToken, refreshToken, user: toUserDto(user) }
  }

  // Expose token verification for the beacon logout endpoint
  verifyToken(token: string) {
    return this.tokenService.verify(token)
  }

  async refresh(input: { refreshToken: string }): Promise<Omit<AuthResult, 'user'>> {
    const payload = this.tokenService.verify(input.refreshToken)

    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type')
    }

    if (!(await this.tokenService.isRefreshValid(payload.jti))) {
      this.log.warn({ event: 'refresh.failure', userId: payload.sub, success: false })
      throw new UnauthorizedError('Refresh token has been revoked')
    }

    await this.tokenService.revokeRefresh(payload.jti)

    const { accessToken, refreshToken, refreshJti } = this.tokenService.signPair(payload.sub)
    await this.tokenService.storeRefresh(refreshJti, payload.sub)

    this.log.info({ event: 'refresh.success', userId: payload.sub, success: true })

    return { accessToken, refreshToken }
  }

  async logout(input: {
    accessJti: string
    accessExp: number
    refreshToken?: string
    ip: string
    userAgent: string
    userId: string
  }): Promise<void> {
    await this.tokenService.blacklistAccess(input.accessJti, input.accessExp)

    if (input.refreshToken) {
      const payload = this.tokenService.verify(input.refreshToken)
      await this.tokenService.revokeRefresh(payload.jti)
    }

    this.log.info({
      event: 'logout',
      userId: input.userId,
      ip: input.ip,
      userAgent: input.userAgent,
      success: true,
    })
  }
}
