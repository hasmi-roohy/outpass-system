from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import dotenv_values
from routes import face, chat

# Load env
config = dotenv_values(".env")

# Create FastAPI app
app = FastAPI(
    title="Outpass AI Service",
    description="Face Recognition + Chatbot API",
    version="1.0.0"
)

# Allow Express to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register routes
app.include_router(face.router, prefix="/face", tags=["Face Recognition"])
app.include_router(chat.router, prefix="/chat", tags=["Chatbot"])

# Health check
@app.get("/")
def root():
    return { "message": "✅ AI Service is running" }