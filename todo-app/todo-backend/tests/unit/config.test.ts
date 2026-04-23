import { describe, it, expect } from 'vitest'
import { env } from '../../src/config/env'

describe('env config', () => {
  it('exports env object with validated values', () => {
    expect(env.NODE_ENV).toBe('test')
    expect(env.PORT).toBe(3001)
    expect(env.JWT_ISSUER).toBe('todo-api')
    expect(env.BCRYPT_ROUNDS).toBe(4)
  })

  it('applies default values for optional vars', () => {
    expect(env.JWT_EXPIRES_IN).toBe('15m')
    expect(env.LOG_LEVEL).toBe('warn')
    expect(env.CORS_ORIGIN).toBe('*')
  })
})
