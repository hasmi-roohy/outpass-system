import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from routes import face, chat

load_dotenv()

express_url = os.getenv("EXPRESS_URL", "http://localhost:5000")
ai_service_api_key = os.getenv("AI_SERVICE_API_KEY", "")

app = FastAPI(
    title="Outpass AI Service",
    description="Face Recognition + Chatbot API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[express_url],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.middleware("http")
async def require_internal_api_key(request: Request, call_next):
    if ai_service_api_key and request.url.path != "/":
        provided_key = request.headers.get("x-ai-service-key", "")
        if provided_key != ai_service_api_key:
            return JSONResponse(
                status_code=401,
                content={"message": "Unauthorized AI service request"}
            )
    return await call_next(request)


app.include_router(face.router, prefix="/face", tags=["Face Recognition"])
app.include_router(chat.router, prefix="/chat", tags=["Chatbot"])


@app.get("/")
def root():
    return {"message": "AI Service is running"}
