const axios = require('axios')

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'
const AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 15000)
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || ''
const aiHeaders = AI_SERVICE_API_KEY
  ? { 'x-ai-service-key': AI_SERVICE_API_KEY }
  : {}

const buildPayload = (image, studentId, type, parentIndex = null) => {
  const payload = {
    image,
    studentId,
    face_type: type
  }

  if (parentIndex !== null && parentIndex !== undefined) {
    payload.parent_index = Number.parseInt(parentIndex, 10)
  }

  return payload
}

const registerFace = async (image, studentId, type, parentIndex = null) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/face/register-face`,
      buildPayload(image, studentId, type, parentIndex),
      { timeout: AI_SERVICE_TIMEOUT_MS, headers: aiHeaders }
    )
    return response.data

  } catch (error) {
    console.log('Face registration error:', error.message)
    if (error.response) {
      console.log('FastAPI response:', error.response.data)
    }
    return { success: false, message: error.message }
  }
}

const verifyFace = async (image, studentId, type, parentIndex = null) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/face/verify-face`,
      buildPayload(image, studentId, type, parentIndex),
      { timeout: AI_SERVICE_TIMEOUT_MS, headers: aiHeaders }
    )
    return response.data

  } catch (error) {
    console.log('Face service error:', error.message)
    if (error.response) {
      console.log('FastAPI response:', error.response.data)
    }
    return { matched: false, confidence: 0 }
  }
}

module.exports = { verifyFace, registerFace }
