const axios = require('axios')

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

const registerFace = async (image, studentId, type, parentIndex = null) => {
  try {
    const payload = {
      image,
      studentId,
      face_type: type
    }

    // ← Only add parent_index if it's actually a number
    if (parentIndex !== null && parentIndex !== undefined) {
      payload.parent_index = parseInt(parentIndex)
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/face/register-face`,
      payload
    )
    return response.data

  } catch (error) {
    console.log('❌ Face registration error:', error.message)
    if (error.response) {
      console.log('❌ FastAPI response:', error.response.data)
    }
    return { success: false, message: error.message }
  }
}

const verifyFace = async (image, studentId, type, parentIndex = null) => {
  try {
    const payload = {
      image,
      studentId,
      face_type: type
    }

    // ← Only add parent_index if it's actually a number
    if (parentIndex !== null && parentIndex !== undefined) {
      payload.parent_index = parseInt(parentIndex)
    }

    console.log('🔍 Sending to FastAPI:', {
      studentId,
      face_type:    type,
      parent_index: payload.parent_index,
      image_length: image?.length
    })

    const response = await axios.post(
      `${AI_SERVICE_URL}/face/verify-face`,
      payload
    )
    return response.data

  } catch (error) {
    console.log('❌ Face service error:', error.message)
    if (error.response) {
      console.log('❌ FastAPI response:', error.response.data)
    }
    return { matched: false, confidence: 0 }
  }
}

module.exports = { verifyFace, registerFace }