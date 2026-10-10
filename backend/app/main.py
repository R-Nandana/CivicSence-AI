"""
CivicSense FastAPI Main Application
Academic NLP System: Phase I Implementation
"""

import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.auth import router as auth_router
from backend.app.api.complaints import router as complaints_router
from backend.app.api.admin import router as admin_router
from backend.app.api.eda import perform_eda
from backend.app.api.speech_translate import router as speech_translate_router
from backend.app.api.nlp_concepts import router as nlp_concepts_router
from backend.app.api.evidence import router as evidence_router
from backend.app.api.related import router as related_router
from backend.app.api.resolution import router as resolution_router
from backend.app.api.db_qa import router as db_qa_router
from backend.app.nlp.pipeline import nlp_pipeline
from fastapi.staticfiles import StaticFiles

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(ROOT_DIR, "data", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(
    title="CivicSense AI API",
    description="NLP-Based Civic Complaint Intelligence & Urban Issue Resolution Monitoring System",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads for Images, Videos, and Keyframes
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# API Root Router with /api prefix
api_router = APIRouter(prefix="/api")

# EDA Router
eda_router = APIRouter(prefix="/eda", tags=["Exploratory Data Analysis"])

@eda_router.get("/summary")
def get_eda_summary():
    """Returns dataset distributions, missing value audits, and vocabulary statistics."""
    return perform_eda()

# Include Sub-Routers
api_router.include_router(auth_router)
api_router.include_router(complaints_router)
api_router.include_router(admin_router)
api_router.include_router(eda_router)
api_router.include_router(speech_translate_router)
api_router.include_router(nlp_concepts_router)
api_router.include_router(evidence_router)
api_router.include_router(related_router)
api_router.include_router(resolution_router)
api_router.include_router(db_qa_router)

@api_router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "CivicSense NLP Engine",
        "covered_concepts": [
            "ETL Pipeline (Extract, Transform, Load - NYC 311 Socrata Open Data)",
            "Exploratory Data Analysis (EDA - Imbalance, Missingness, Vocab Distributions)",
            "1. Text Classification (TF-IDF + Softmax Logistic Regression for 8 Categories)",
            "2. Multi-lingual NLP (LLM-powered: 100+ languages via Gemini, Tamil, Tanglish)",
            "3. Machine Translation (Neural + Domain MT, BLEU benchmark)",
            "4. Speech Processing (ASR Voice-to-Text & Acoustic Analysis, WER benchmark)",
            "5. Named Entity Recognition (LOCATION, INFRASTRUCTURE, DURATION, DEPARTMENT)",
            "6. Question Answering System (Generative QA via Gemini + Extractive FAQ KB)",
            "7. Chatbot (Conversational Civic AI with session memory via Gemini)",
            "8. Market Basket Analysis (Apriori association rules on complaint co-occurrence)"
        ],
        "database": "Ready"
    }


app.include_router(api_router)


@app.get("/")
def root():
    return {
        "project": "CivicSense: NLP-Based Civic Complaint Intelligence System",
        "version": "1.0.0 (Phase I)",
        "docs_url": "/docs",
        "api_prefix": "/api"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
