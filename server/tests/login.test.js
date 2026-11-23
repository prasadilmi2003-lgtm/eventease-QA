import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import User from '../src/models/User.js'
import { login } from '../src/controllers/authController.js'

process.env.JWT_SECRET = 'test-secret'

// Fake Express objects so we can see what login() sends back
const mockRes = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.cookie = vi.fn().mockReturnValue(res)
  return res
}

// User.findOne(...).select(...) is a chain, so the mock returns an object with select()
const mockFindOne = (result) =>
  vi.spyOn(User, 'findOne').mockReturnValue({ select: vi.fn().mockResolvedValue(result) })

const fakeUser = (status = 'active') => ({
  _id: 'u1', name: 'Test User', email: 'user@test.com', role: 'attendee',
  passwordHash: 'hashed', accountStatus: status,
})

describe('login() - white-box basis path tests', () => {
  let res, next
  beforeEach(() => {
    vi.restoreAllMocks()
    res = mockRes()
    next = vi.fn()
  })

  it('TC1 / P1: database error -> next(error)', async () => {
    const dbError = new Error('DB down')
    vi.spyOn(User, 'findOne').mockReturnValue({ select: vi.fn().mockRejectedValue(dbError) })

    await login({ body: { email: 'user@test.com', password: 'Pass123' } }, res, next)

    expect(next).toHaveBeenCalledWith(dbError)
    expect(res.cookie).not.toHaveBeenCalled()
  })

  it('TC2 / P2: invalid input -> 400', async () => {
    await login({ body: { email: 'not-an-email', password: '' } }, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0][0].message).toBe('Validation failed')
  })

  it('TC3 / P3: unknown email -> 401', async () => {
    mockFindOne(null)

    await login({ body: { email: 'nobody@test.com', password: 'Pass123' } }, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('TC4 / P4: wrong password -> 401', async () => {
    mockFindOne(fakeUser())
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false)

    await login({ body: { email: 'user@test.com', password: 'WrongPass' } }, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('TC5 / P5: suspended account -> 403', async () => {
    mockFindOne(fakeUser('suspended'))
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true)

    await login({ body: { email: 'user@test.com', password: 'Pass123' } }, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.cookie).not.toHaveBeenCalled()
  })

  it('TC6 / P6: valid login -> 200 + cookie, no passwordHash', async () => {
    mockFindOne(fakeUser())
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true)

    await login({ body: { email: 'user@test.com', password: 'Pass123' } }, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.cookie).toHaveBeenCalledWith('eventease_token', expect.any(String), expect.any(Object))
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('passwordHash')
  })
})