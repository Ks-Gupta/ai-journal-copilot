from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.data.journals import JOURNAL_DB
from app.services.vector_db import build_index

build_index(JOURNAL_DB)

app = FastAPI(title="AI Journal Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def health():
    return {"status": "running"}