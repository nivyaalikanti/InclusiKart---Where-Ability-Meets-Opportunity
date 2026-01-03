from fastapi import FastAPI
from pydantic import BaseModel
from rag.query import process_voice_command

app = FastAPI()

class VoiceRequest(BaseModel):
    command: str
    role: str = "guest"

@app.post("/voice-command")
def voice_command(req: VoiceRequest):
    return process_voice_command(req.command, req.role)
