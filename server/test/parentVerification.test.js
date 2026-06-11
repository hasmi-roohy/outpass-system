const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createParentVerificationToken,
  verifyParentVerificationToken
} = require('../utils/parentVerification')

const secret = 'test-secret-that-is-not-used-outside-tests'

test('parent verification proof is bound to the approval link', () => {
  const verificationToken = createParentVerificationToken({
    parentToken: 'parent-link-1',
    outpassId: 'outpass-1',
    secret
  })

  const result = verifyParentVerificationToken({
    verificationToken,
    parentToken: 'parent-link-1',
    secret
  })

  assert.equal(result.scope, 'parent-response')
  assert.equal(result.outpassId, 'outpass-1')
})

test('parent verification proof cannot be used for another approval link', () => {
  const verificationToken = createParentVerificationToken({
    parentToken: 'parent-link-1',
    outpassId: 'outpass-1',
    secret
  })

  assert.throws(() => verifyParentVerificationToken({
    verificationToken,
    parentToken: 'parent-link-2',
    secret
  }))
})
