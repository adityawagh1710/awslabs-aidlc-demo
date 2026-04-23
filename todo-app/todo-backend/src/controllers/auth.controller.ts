import type { FastifyRequest, FastifyReply } from 'fastify'

import type { AuthService } from '../services/auth.service'

interface RegisterBody {
  email: string
  password: string
}

interface LoginBody {
  email: string
  password: string
}

interface RefreshBody {
  refreshToken: string
}

interface LogoutBody {
  refreshToken?: string
}

interface LogoutBeaconBody {
  accessToken?: string
  refreshToken?: string
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply): Promise<void> {
    const result = await this.authService.register(request.body)
    return reply.status(201).send(result)
  }

  async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply): Promise<void> {
    const ip = request.ip
    const userAgent = (request.headers['user-agent'] as string) ?? 'unknown'
    const result = await this.authService.login({ ...request.body, ip, userAgent })
    return reply.status(200).send(result)
  }

  async refresh(request: FastifyRequest<{ Body: RefreshBody }>, reply: FastifyReply): Promise<void> {
    const result = await this.authService.refresh(request.body)
    return reply.status(200).send(result)
  }

  async logout(request: FastifyRequest<{ Body: LogoutBody }>, reply: FastifyReply): Promise<void> {
    const ip = request.ip
    const userAgent = (request.headers['user-agent'] as string) ?? 'unknown'
    const { sub: userId, jti: accessJti, exp: accessExp } = request.user
    await this.authService.logout({
      accessJti,
      accessExp,
      refreshToken: request.body.refreshToken,
      ip,
      userAgent,
      userId,
    })
    return reply.status(204).send()
  }

  // Called by navigator.sendBeacon on window close — no Authorization header available,
  // so the access token is passed in the request body instead.
  async logoutBeacon(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const body = request.body as LogoutBeaconBody
    const { accessToken, refreshToken } = body
    if (!accessToken) return reply.status(204).send()

    try {
      const payload = this.authService.verifyToken(accessToken)
      const ip = request.ip
      const userAgent = (request.headers['user-agent'] as string) ?? 'beacon'
      await this.authService.logout({
        accessJti: payload.jti,
        accessExp: payload.exp,
        refreshToken,
        ip,
        userAgent,
        userId: payload.sub,
      })
    } catch {
      // Token already expired or invalid — nothing to blacklist
    }
    return reply.status(204).send()
  }
}
