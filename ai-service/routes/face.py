from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from face.face_utils import register_face, verify_face

router = APIRouter()

# ─────────────────────────────────────
# Request Models
# ─────────────────────────────────────

class RegisterRequest(BaseModel):
    image:        str
    studentId:    str
    face_type:    str           = "student"
    parent_index: Optional[int] = None

class VerifyRequest(BaseModel):
    image:        str
    studentId:    str
    face_type:    str           = "student"
    parent_index: Optional[int] = None

# ─────────────────────────────────────
# Routes
# ─────────────────────────────────────

# @route  POST /face/register-face
# @desc   Admin registers student/parent face
@router.post("/register-face")
def register(req: RegisterRequest):
    result = register_face(
        base64_image = req.image,
        student_id   = req.studentId,
        face_type    = req.face_type,
        parent_index = req.parent_index
    )
    return result

# @route  POST /face/verify-face
# @desc   Verifies student or parent face
@router.post("/verify-face")
def verify(req: VerifyRequest):
    result = verify_face(
        base64_image = req.image,
        student_id   = req.studentId,
        face_type    = req.face_type,
        parent_index = req.parent_index
    )
    return result