"""
CivicSense NLP Concept 7: Chatbot
Conversational AI assistant for civic governance using Google Gemini.
- Session-based multi-turn conversation memory
- Intent detection: complaint filing, status query, civic info, general
- Graceful fallback with rule-based responses when Gemini unavailable
"""

import os
import re
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# ── Intent Keywords ───────────────────────────────────────────────────────────
INTENT_PATTERNS = {
    "complaint_file": [
        "report", "complain", "complaint", "submit", "file", "pothole", "water",
        "garbage", "drainage", "streetlight", "light", "road", "sewage"
    ],
    "status_query": [
        "status", "track", "progress", "update", "resolved", "pending", "check"
    ],
    "civic_info": [
        "how", "what", "when", "who", "which", "department", "process", "resolve",
        "time", "contact", "category"
    ],
    "greeting": ["hi", "hello", "hey", "good morning", "good evening", "namaste"],
    "goodbye": ["bye", "goodbye", "thank you", "thanks", "done", "exit"],
}

# ── Rule-Based Fallback Responses ─────────────────────────────────────────────
FALLBACK_RESPONSES = {
    "greeting": (
        "Hello! I'm CivicAssist, your AI-powered civic governance assistant. "
        "I can help you file complaints, track their status, explain how the AI pipeline works, "
        "or answer questions about municipal services. What can I help you with today?"
    ),
    "goodbye": (
        "Thank you for using CivicSense! Your civic concerns matter. "
        "Have a great day and feel free to return if you need assistance."
    ),
    "complaint_file": (
        "To file a complaint, go to the Citizen Portal and describe your issue clearly. "
        "Include: (1) What the problem is, (2) Where it is (street/landmark), "
        "(3) How long it has existed. Our AI will auto-classify it and route it to the right department!"
    ),
    "status_query": (
        "You can track your complaints in the 'My Complaints' section of the Citizen Portal. "
        "Status options: New → Under Review → In Progress → Resolved. "
        "If your complaint has been pending for more than 7 days, consider escalating it."
    ),
    "civic_info": (
        "CivicSense handles 8 categories of civic complaints: Roads, Water Supply, Drainage, "
        "Streetlights, Waste Management, Sanitation, Traffic, and Public Infrastructure. "
        "Our AI automatically classifies your complaint and extracts entities like location and duration."
    ),
    "default": (
        "I'm here to help with civic complaints and municipal services. "
        "You can ask me about filing complaints, checking their status, "
        "understanding how our AI works, or getting department contact information."
    )
}

SYSTEM_PROMPT = """You are CivicAssist, a friendly and knowledgeable AI chatbot for CivicSense — an NLP-based civic complaint management system.

Your capabilities:
- Help citizens file and understand civic complaints (Roads, Water, Drainage, Streetlights, Waste, Sanitation, Traffic, Public Infrastructure)
- Explain how the AI pipeline works (language detection, translation, classification, NER)
- Provide information about municipal departments and resolution timelines
- Guide users through the complaint submission process
- Answer questions about complaint status tracking

Personality: Professional yet approachable, empathetic, civic-minded.
Response style: Concise (2-4 sentences), actionable, encouraging.
Language: Always respond in clear English regardless of input language.

IMPORTANT: You are ONLY a civic governance assistant. Politely decline unrelated topics."""


def _detect_intent(message: str) -> str:
    """Simple rule-based intent detection."""
    lower = message.lower()
    scores = {intent: 0 for intent in INTENT_PATTERNS}
    for intent, keywords in INTENT_PATTERNS.items():
        scores[intent] = sum(1 for kw in keywords if kw in lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "default"


class CivicChatbot:
    """
    Conversational civic assistant.
    Maintains per-session conversation history for multi-turn dialogue.
    """

    def __init__(self):
        self._gemini_model = None
        self._sessions: Dict[str, List[Dict]] = {}  # session_id -> message history
        self._init_gemini()

    def _init_gemini(self):
        if HAS_GEMINI and GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                self._gemini_model = genai.GenerativeModel(
                    "gemini-1.5-flash",
                    system_instruction=SYSTEM_PROMPT
                )
            except Exception:
                self._gemini_model = None

    def chat(self, message: str, session_id: str = "default") -> Dict[str, Any]:
        """
        Process a user message and return chatbot response.
        Maintains conversation history per session_id.
        """
        if not message or not message.strip():
            return self._build_response("Please type a message so I can assist you!", session_id, "default")

        msg = message.strip()
        intent = _detect_intent(msg)

        # Initialize session
        if session_id not in self._sessions:
            self._sessions[session_id] = []

        # Add user message to history
        self._sessions[session_id].append({
            "role": "user",
            "content": msg,
            "timestamp": datetime.now().isoformat()
        })

        # 1. Gemini multi-turn response
        if self._gemini_model:
            response_text = self._gemini_chat(session_id, msg)
            if response_text:
                self._sessions[session_id].append({
                    "role": "assistant",
                    "content": response_text,
                    "timestamp": datetime.now().isoformat()
                })
                return self._build_response(response_text, session_id, intent, engine="Google Gemini 1.5 Flash")

        # 2. Rule-based fallback
        fallback = FALLBACK_RESPONSES.get(intent, FALLBACK_RESPONSES["default"])
        self._sessions[session_id].append({
            "role": "assistant",
            "content": fallback,
            "timestamp": datetime.now().isoformat()
        })
        return self._build_response(fallback, session_id, intent, engine="Rule-Based Chatbot")

    def _gemini_chat(self, session_id: str, current_message: str) -> Optional[str]:
        """Build conversation history and get Gemini response."""
        history = self._sessions.get(session_id, [])
        # Build the conversation turns (exclude current message already added)
        turns_text = ""
        for turn in history[:-1]:  # all except the current user message
            role_label = "User" if turn["role"] == "user" else "CivicAssist"
            turns_text += f"{role_label}: {turn['content']}\n"

        prompt = f"{turns_text}User: {current_message}\nCivicAssist:"

        try:
            resp = self._gemini_model.generate_content(prompt)
            return resp.text.strip()
        except Exception:
            return None

    def get_session_history(self, session_id: str) -> List[Dict]:
        """Return conversation history for a session."""
        return self._sessions.get(session_id, [])

    def clear_session(self, session_id: str):
        """Clear conversation history for a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]

    def get_stats(self) -> Dict[str, Any]:
        """Return chatbot statistics."""
        return {
            "active_sessions": len(self._sessions),
            "total_messages": sum(len(msgs) for msgs in self._sessions.values()),
            "engine": "Google Gemini 1.5 Flash" if self._gemini_model else "Rule-Based Fallback",
            "gemini_available": bool(self._gemini_model)
        }

    def _build_response(
        self, text: str, session_id: str, intent: str, engine: str = "Rule-Based Chatbot"
    ) -> Dict[str, Any]:
        history = self._sessions.get(session_id, [])
        return {
            "response": text,
            "intent": intent,
            "session_id": session_id,
            "turn_count": len(history),
            "engine": engine,
            "timestamp": datetime.now().isoformat()
        }


# Singleton
civic_chatbot = CivicChatbot()


if __name__ == "__main__":
    print("=" * 65)
    print("   CIVICSENSE CHATBOT DEMONSTRATION")
    print("=" * 65)

    session = "demo_session"
    conversation = [
        "Hello!",
        "I want to report a pothole near my house.",
        "How does the AI classify my complaint?",
        "Can I submit in Tamil?",
        "What is the resolution time for water supply issues?",
        "Thank you!",
    ]

    for msg in conversation:
        print(f"\nUser: {msg}")
        res = civic_chatbot.chat(msg, session_id=session)
        print(f"Bot : {res['response']}")
        print(f"     [Intent: {res['intent']} | Engine: {res['engine']}]")
