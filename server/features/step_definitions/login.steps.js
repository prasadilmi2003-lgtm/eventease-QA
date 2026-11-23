import { Given, When, Then, After } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import User from '../../src/models/User.js'
import app from '../../src/app.js'

process.env.JWT_SECRET = 'test-secret'
const realFindOne = User.findOne

Given('the following users exist:', async function (table) {
  const users = await Promise.all(
    table.hashes().map(async (row, i) => ({
      _id: `u${i}`,
      name: 'Test User',
      role: 'attendee',
      email: row.email,
      passwordHash: await bcrypt.hash(row.password, 4), // real bcrypt hash
      accountStatus: row.status,
    })),
  )
  // shortcut: in-memory fake of the database lookup, so no MongoDB is needed; use a real test DB for full integration testing
  User.findOne = ({ email }) => ({
    select: async () => users.find((u) => u.email === email) ?? null,
  })
})

After(function () {
  User.findOne = realFindOne
})

When('I log in with email {string} and password {string}', async function (email, password) {
  this.response = await request(app).post('/api/auth/login').send({ email, password })
})

Then('the response status should be {int}', function (status) {
  assert.equal(this.response.status, status)
})

Then('the error message should be {string}', function (message) {
  assert.equal(this.response.body.message, message)
})

Then('I should receive a login cookie', function () {
  const cookies = this.response.headers['set-cookie'] ?? []
  assert.ok(cookies.some((c) => c.startsWith('eventease_token=')))
})

Then('I should not receive a login cookie', function () {
  assert.equal(this.response.headers['set-cookie'], undefined)
})

Then('the response should not contain the password hash', function () {
  assert.ok(!('passwordHash' in this.response.body))
})