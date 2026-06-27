const test = require('node:test')
const assert = require('node:assert/strict')
const {
  requireAssignedWarden,
  requireAssignedGateWarden,
  requireStatus
} = require('../utils/outpassGuards')

const response = () => {
  const result = { statusCode: null, body: null }
  return {
    result,
    status(code) {
      result.statusCode = code
      return this
    },
    json(body) {
      result.body = body
      return this
    }
  }
}

test('assigned warden is allowed', () => {
  const res = response()
  const allowed = requireAssignedWarden(
    { warden1Id: { toString: () => 'warden-1' } },
    { user: { _id: { toString: () => 'warden-1' } } },
    res
  )

  assert.equal(allowed, true)
  assert.equal(res.result.statusCode, null)
})

test('assigned populated warden is allowed', () => {
  const res = response()
  const allowed = requireAssignedWarden(
    { warden1Id: { _id: { toString: () => 'warden-1' }, name: 'Warden' } },
    { user: { _id: { toString: () => 'warden-1' } } },
    res
  )

  assert.equal(allowed, true)
  assert.equal(res.result.statusCode, null)
})

test('unassigned warden is rejected', () => {
  const res = response()
  const allowed = requireAssignedWarden(
    { warden1Id: { toString: () => 'warden-1' } },
    { user: { _id: { toString: () => 'warden-2' } } },
    res
  )

  assert.equal(allowed, false)
  assert.equal(res.result.statusCode, 403)
})

test('invalid workflow status is rejected', () => {
  const res = response()
  const allowed = requireStatus({ status: 'returned' }, ['approved'], res)

  assert.equal(allowed, false)
  assert.equal(res.result.statusCode, 409)
})

test('unassigned gate warden is rejected', () => {
  const res = response()
  const allowed = requireAssignedGateWarden(
    { warden2Id: { toString: () => 'gate-1' } },
    { user: { _id: { toString: () => 'gate-2' } } },
    res
  )

  assert.equal(allowed, false)
  assert.equal(res.result.statusCode, 403)
})
