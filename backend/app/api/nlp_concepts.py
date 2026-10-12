"""
CivicSense API: New NLP Concepts Router
Exposes Phase II NLP concepts:
  - /nlp/translate-llm        (Concept 2 Enhanced: LLM Universal Translation)
  - /nlp/qa                   (Concept 6: Question Answering)
  - /nlp/qa/faqs              (Concept 6: All FAQs)
  - /nlp/chat                 (Concept 7: Chatbot)
  - /nlp/chat/history/{sid}   (Concept 7: Chat history)
  - /nlp/chat/clear/{sid}     (Concept 7: Clear session)
  - /nlp/market-basket        (Concept 8: Market Basket Analysis)
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.app.nlp.llm_multilingual import llm_multilingual
from backend.app.nlp.qa_system import civic_qa
from backend.app.nlp.chatbot import civic_chatbot
from backend.app.nlp.market_basket import market_basket_analyzer

router = APIRouter(prefix="/nlp", tags=["NLP Concepts"])


# ── Request Schemas ────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str
    source_language: Optional[str] = None
    target_language: Optional[str] = "English"


class QARequest(BaseModel):
    question: str
    context: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class MarketBasketRequest(BaseModel):
    min_support: Optional[float] = 0.15
    min_confidence: Optional[float] = 0.50
    min_lift: Optional[float] = 1.0


# ── Concept 2 Enhanced: LLM Universal Translation ─────────────────────────────

@router.post("/translate-llm")
def translate_with_llm(req: TranslateRequest):
    """
    Concept 2 (Enhanced): Universal language detection + translation via Google Gemini.
    Accepts ANY language (100+) and translates to requested target language (English standard).
    Falls back to deep_translator / rule-based approach if Gemini unavailable.
    """
    result = llm_multilingual.detect_and_translate(
        text=req.text,
        source_language=req.source_language,
        target_language=req.target_language or "English"
    )
    return result


@router.post("/detect-language")
def detect_language(req: TranslateRequest):
    """Detect language of input text using Gemini LLM."""
    info = llm_multilingual.get_language_info(req.text)
    return {
        "text": req.text,
        "language_info": info
    }


# ── Concept 6: Question Answering System ──────────────────────────────────────

@router.post("/qa")
def question_answer(req: QARequest):
    """
    Concept 6: Civic Question Answering System.
    Generative QA via Gemini + Extractive FAQ fallback.
    """
    return civic_qa.answer(req.question, context=req.context)


@router.get("/qa/faqs")
def get_all_faqs():
    """Return all civic FAQ knowledge base entries."""
    return {
        "total": len(civic_qa.get_all_faqs()),
        "faqs": civic_qa.get_all_faqs()
    }


# ── Concept 7: Chatbot ────────────────────────────────────────────────────────

@router.post("/chat")
def chat_with_bot(req: ChatRequest):
    """
    Concept 7: Conversational Civic Chatbot.
    Multi-turn conversation with session memory via Gemini.
    """
    return civic_chatbot.chat(req.message, session_id=req.session_id or "default")


@router.get("/chat/history/{session_id}")
def get_chat_history(session_id: str):
    """Get conversation history for a chat session."""
    return {
        "session_id": session_id,
        "history": civic_chatbot.get_session_history(session_id)
    }


@router.delete("/chat/clear/{session_id}")
def clear_chat_session(session_id: str):
    """Clear conversation history for a session."""
    civic_chatbot.clear_session(session_id)
    return {"message": f"Session '{session_id}' cleared.", "session_id": session_id}


@router.get("/chat/stats")
def get_chatbot_stats():
    """Get chatbot usage statistics."""
    return civic_chatbot.get_stats()


# ── Concept 8: Market Basket Analysis ─────────────────────────────────────────

@router.post("/market-basket")
def run_market_basket(req: MarketBasketRequest):
    """
    Concept 8: Market Basket Analysis via Apriori algorithm.
    Discovers co-occurring civic complaint category patterns.
    """
    return market_basket_analyzer.mine_rules(
        min_support=req.min_support,
        min_confidence=req.min_confidence,
        min_lift=req.min_lift
    )


@router.get("/market-basket")
def run_market_basket_default():
    """Market Basket Analysis with default parameters."""
    return market_basket_analyzer.mine_rules()
