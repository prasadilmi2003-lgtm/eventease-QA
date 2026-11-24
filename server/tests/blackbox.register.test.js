/**
 * Member 2 - Black-box testing (Section 3.3)
 * Unit under test: POST /api/auth/register  ->  register() in src/controllers/authController.js
 *
 * Technique coverage:
 *   - Equivalence Partitioning  (EP1..EP14, see docs/qa/section-3.3-black-box-testing.md)
 *   - Boundary Value Analysis   (name 1/2/80/81, password 7/8/72/73, email 254/255)
 * The controller is treated as a black box: only inputs (req.body) and
 * observable outputs (status code, message, errors, cookie) are asserted.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import User from '../src/models/User.js'
import { register } from '../src/controllers/authController.js'

process.env.JWT_SECRET = 'test-secret'

const mockRes = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.cookie = vi.fn().mockReturnValue(res)
  return res
}

// Happy-path doubles: no e-mail already taken, hashing stubbed (12 real rounds is slow)
const noExistingUser = () => vi.spyOn(User, 'findOne').mockResolvedValue(null)
const emailTaken = () => vi.spyOn(User, 'findOne').mockResolvedValue({ _id: 'u0', email: 'taken@test.com' })
const stubCreate = () =>
  vi.spyOn(User, 'create').mockImplementation(async (doc) => ({
    ...doc,
    _id: 'u1',
    toObject: () => ({ ...doc, _id: 'u1' }),
  }))

const valid = {
  name: 'Nimal Perera',
  email: 'nimal@test.com',
  password: 'Pass1234',
  role: 'attendee',
}

// Builds an input by overriding one field of the valid baseline (single-fault assumption)
const body = (over = {}) => ({ ...valid, ...over })

// Email of an exact total length, e.g. emailOfLength(254)
const emailOfLength = (n) => 'a'.repeat(n - 12) + '@example.com'

let res, next
beforeEach(() => {
  vi.restoreAllMocks()
  res = mockRes()
  next = vi.fn()
  noExistingUser()
  stubCreate()
  vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed')
})

// Asserts a rejected registration: 400, named field error, and no session cookie
const expectRejected = (field, messagePart) => {
  expect(res.status).toHaveBeenCalledWith(400)
  const payload = res.json.mock.calls[0][0]
  expect(payload.message).toBe('Validation failed')
  expect(payload.errors[field]).toContain(messagePart)
  expect(res.cookie).not.toHaveBeenCalled()
}

const expectAccepted = () => {
  expect(res.status).toHaveBeenCalledWith(201)
  expect(res.cookie).toHaveBeenCalledWith('eventease_token', expect.any(String), expect.any(Object))
  expect(res.json.mock.calls[0][0]).not.toHaveProperty('passwordHash')
}

describe('Register - Equivalence Partitioning', () => {
  it('BB-REG-01 / EP1,EP4,EP7,EP12: all fields in valid partitions -> 201 + cookie', async () => {
    await register({ body: body() }, res, next)
    expectAccepted()
  })

  it('BB-REG-02 / EP2: name shorter than 2 characters -> 400', async () => {
    await register({ body: body({ name: 'N' }) }, res, next)
    expectRejected('name', 'at least 2 characters')
  })

  it('BB-REG-03 / EP3: name longer than 80 characters -> 400', async () => {
    await register({ body: body({ name: 'N'.repeat(81) }) }, res, next)
    expectRejected('name', 'cannot exceed 80 characters')
  })

  it('BB-REG-04 / EP5: malformed email (no @) -> 400', async () => {
    await register({ body: body({ email: 'nimaltest.com' }) }, res, next)
    expectRejected('email', 'valid email address')
  })

  it('BB-REG-05 / EP6: email already registered -> 400, duplicate message', async () => {
    emailTaken()
    await register({ body: body({ email: 'taken@test.com' }) }, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0][0].message).toBe('This email is already registered')
    expect(res.cookie).not.toHaveBeenCalled()
  })

  it('BB-REG-06 / EP8: password shorter than 8 characters -> 400', async () => {
    await register({ body: body({ password: 'Pass12' }) }, res, next)
    expectRejected('password', 'at least 8 characters')
  })

  it('BB-REG-07 / EP10: password with letters only -> 400', async () => {
    await register({ body: body({ password: 'Password' }) }, res, next)
    expectRejected('password', 'at least one number')
  })

  it('BB-REG-08 / EP11: password with digits only -> 400', async () => {
    await register({ body: body({ password: '12345678' }) }, res, next)
    expectRejected('password', 'at least one letter')
  })

  it('BB-REG-09 / EP12: role "organizer" is accepted -> 201', async () => {
    await register({ body: body({ role: 'organizer' }) }, res, next)
    expectAccepted()
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'organizer' }))
  })

  it('BB-REG-10 / EP13: self-assigning role "admin" is rejected -> 400', async () => {
    await register({ body: body({ role: 'admin' }) }, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(User.create).not.toHaveBeenCalled()
  })

  it('BB-REG-11 / EP14: omitted role defaults to attendee -> 201', async () => {
    const { role, ...withoutRole } = body()
    await register({ body: withoutRole }, res, next)
    expectAccepted()
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'attendee' }))
  })

  it('BB-REG-12 / EP4: mixed-case email is stored lower-cased and trimmed -> 201', async () => {
    await register({ body: body({ email: '  Nimal@TEST.com  ' }) }, res, next)
    expectAccepted()
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'nimal@test.com' }))
  })
})

describe('Register - Boundary Value Analysis', () => {
  it.each([
    ['BB-REG-13', 1, false],
    ['BB-REG-14', 2, true],
    ['BB-REG-15', 80, true],
    ['BB-REG-16', 81, false],
  ])('%s: name length %i -> accepted=%s', async (_id, length, accepted) => {
    await register({ body: body({ name: 'N'.repeat(length) }) }, res, next)
    expect(res.status).toHaveBeenCalledWith(accepted ? 201 : 400)
  })

  it.each([
    ['BB-REG-17', 7, false],
    ['BB-REG-18', 8, true],
    ['BB-REG-19', 72, true],
    ['BB-REG-20', 73, false],
  ])('%s: password length %i -> accepted=%s', async (_id, length, accepted) => {
    const password = 'Pass1' + 'x'.repeat(length - 5) // always 1 digit + letters
    expect(password).toHaveLength(length)
    await register({ body: body({ password }) }, res, next)
    expect(res.status).toHaveBeenCalledWith(accepted ? 201 : 400)
  })

  it.each([
    ['BB-REG-21', 254, true],
    ['BB-REG-22', 255, false],
  ])('%s: email length %i -> accepted=%s', async (_id, length, accepted) => {
    await register({ body: body({ email: emailOfLength(length) }) }, res, next)
    expect(res.status).toHaveBeenCalledWith(accepted ? 201 : 400)
  })
})
