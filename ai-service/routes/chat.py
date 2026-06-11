from fastapi import APIRouter
from pydantic import BaseModel
from chatbot.predict import predict_intent

router = APIRouter()

# ─────────────────────────────────────
# Request Model
# ─────────────────────────────────────
class ChatRequest(BaseModel):
    message:   str
    studentId: str

# ─────────────────────────────────────
# Routes
# ─────────────────────────────────────

# @route  POST /chat
# @desc   Student sends message to chatbot
@router.post("/")
def chat(req: ChatRequest):
    try:
        result = predict_intent(req.message)
        return {
            "intent": result["intent"],
            "reply":  result["reply"]
        }
    except Exception as e:
        return {
            "intent": "unknown",
            "reply":  "Sorry I could not understand that."
        }
