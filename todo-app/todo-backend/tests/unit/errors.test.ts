import { describe, it, expect } from 'vitest'
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
  ServiceUnavailableError,
} from '../../src/domain/errors'

describe('domain errors', () => {
  it('NotFoundError has statusCode 404', () => {
    const err = new NotFoundError('Task')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Task not found')
    expect(err instanceof Error).toBe(true)
  })

  it('ForbiddenError has statusCode 403', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.message).toBe('Access denied')
  })

  it('ConflictError has statusCode 409', () => {
    const err = new ConflictError('Email already registered')
    expect(err.statusCode).toBe(409)
    expect(err.message).toBe('Email already registered')
  })

  it('UnauthorizedError has statusCode 401', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe('Unauthorized')
  })

  it('ValidationError has statusCode 400 and optional fields', () => {
    const fields = { email: 'Invalid email format' }
    const err = new ValidationError('Validation failed', fields)
    expect(err.statusCode).toBe(400)
    expect(err.fields).toEqual(fields)
  })

  it('ServiceUnavailableError has statusCode 503', () => {
    const err = new ServiceUnavailableError()
    expect(err.statusCode).toBe(503)
  })

  it('errors preserve their class name', () => {
    expect(new NotFoundError('X').name).toBe('NotFoundError')
    expect(new ForbiddenError().name).toBe('ForbiddenError')
    expect(new UnauthorizedError().name).toBe('UnauthorizedError')
  })
})
