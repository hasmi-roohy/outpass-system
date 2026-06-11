const jwt = require('jsonwebtoken')

const createParentVerificationToken = ({ parentToken, outpassId, secret }) =>
  jwt.sign(
    { scope: 'parent-response', parentToken, outpassId: outpassId.toString() },
    secret,
    { expiresIn: '5m' }
  )

const verifyParentVerificationToken = ({ verificationToken, parentToken, secret }) => {
  const verification = jwt.verify(verificationToken, secret)

  if (verification.scope !== 'parent-response' || verification.parentToken !== parentToken) {
    throw new Error('Face verification does not match this approval link')
  }

  return verification
}

module.exports = { createParentVerificationToken, verifyParentVerificationToken }
