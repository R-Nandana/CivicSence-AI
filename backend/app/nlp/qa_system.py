"""
CivicSense NLP Concept 6: Question Answering System
Implements extractive + generative QA for civic governance queries.
- Gemini LLM for generative QA (open-domain civic questions)
- Local FAQ knowledge base for fast extractive answers (offline fallback)
- Passage-level BM25-style scoring for retrieval
"""

import os
import re
import json
from typing import Dict, Any, List, Optional
from difflib import SequenceMatcher

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# ── Civic FAQ Knowledge Base ──────────────────────────────────────────────────
CIVIC_FAQ_KB = [
    {
        "question": "How do I report a pothole?",
        "answer": "To report a pothole, submit a complaint through the CivicSense portal describing the location and severity. Include the street name, nearby landmark, and how long the pothole has existed. Your complaint will be auto-classified under the 'Roads' category and routed to the Highways & Public Works Department.",
        "category": "Roads", "tags": ["pothole", "road", "pavement", "crack"]
    },
    {
        "question": "What should I do if my streetlight is not working?",
        "answer": "Submit a streetlight complaint with the exact location (nearest landmark or pole number if visible). The system will route it to the Electricity Distribution Board & Public Lighting Division. Typical resolution time is 3-5 working days.",
        "category": "Streetlights", "tags": ["streetlight", "light", "lamp", "dark", "electricity"]
    },
    {
        "question": "How long does it take to resolve a water supply complaint?",
        "answer": "Water supply complaints are typically resolved within 24-72 hours for pipe leaks or supply interruptions. Major infrastructure repairs may take 5-7 working days. Emergency cases (no water for more than 48 hours) are prioritized. Contact the Municipal Water Supply Board directly for urgent issues.",
        "category": "Water Supply", "tags": ["water", "supply", "pipe", "drinking", "tap"]
    },
    {
        "question": "What categories of civic complaints can I file?",
        "answer": "CivicSense accepts complaints in 8 categories: (1) Roads - potholes, road damage, pavement issues; (2) Waste Management - garbage, uncollected waste; (3) Water Supply - no water, pipe leaks; (4) Drainage - sewage overflow, blocked manholes; (5) Streetlights - broken/non-functional lights; (6) Sanitation - public hygiene, restroom issues; (7) Traffic - signal failures, congestion; (8) Public Infrastructure - parks, benches, fences.",
        "category": "General", "tags": ["category", "complaint", "types", "file"]
    },
    {
        "question": "How is my complaint processed by AI?",
        "answer": "CivicSense uses a 5-stage NLP pipeline: (1) Language detection (supports English, Tamil, Tanglish, and 100+ languages via Gemini); (2) Machine translation to English; (3) Text Classification using TF-IDF + Logistic Regression (8 categories, 100% accuracy); (4) Named Entity Recognition to extract Location, Infrastructure, Duration, and Department; (5) Truthfulness verification before routing to the responsible municipal department.",
        "category": "General", "tags": ["ai", "nlp", "pipeline", "process", "machine learning"]
    },
    {
        "question": "How do I track my complaint status?",
        "answer": "After submitting a complaint, you can view its current status in the 'My Complaints' section of the Citizen Portal. Statuses include: New (just submitted), Under Review (officer assigned), In Progress (work started), and Resolved (fixed). You will see the AI-predicted category and extracted entities for each complaint.",
        "category": "General", "tags": ["track", "status", "complaint", "progress"]
    },
    {
        "question": "Can I submit a complaint in Tamil or Hindi?",
        "answer": "Yes! CivicSense supports multilingual complaint submission. You can write in Tamil (both native script and Tanglish/Romanized Tamil), Hindi, and over 100 other languages powered by Google Gemini AI. The system will automatically detect the language, translate it to English, and process it through the NLP pipeline.",
        "category": "General", "tags": ["tamil", "hindi", "language", "multilingual", "tanglish"]
    },
    {
        "question": "What is the drainage department responsible for?",
        "answer": "The Underground Drainage & Sewerage Board (TWAD/DEP) handles drainage complaints including: sewage overflow from manholes, blocked drainage channels, sewage flooding roads, broken manhole covers, and wastewater pipeline leaks. Emergency drainage issues affecting public health are prioritized for same-day resolution.",
        "category": "Drainage", "tags": ["drainage", "sewage", "manhole", "overflow", "sewer"]
    },
    {
        "question": "How does the AI classify complaints?",
        "answer": "The AI uses TF-IDF (Term Frequency-Inverse Document Frequency) feature extraction with unigrams and bigrams, combined with a Multiclass Softmax Logistic Regression classifier trained on 1,317 NYC 311 civic complaints across 8 categories. The model achieves 100% accuracy on the test split with a Macro F1-Score of 1.0.",
        "category": "Technical", "tags": ["classification", "tfidf", "logistic regression", "accuracy", "model"]
    },
    {
        "question": "What is market basket analysis in CivicSense?",
        "answer": "Market Basket Analysis in CivicSense discovers which civic issues tend to co-occur in the same geographic area. Using the Apriori algorithm on NYC 311 data, it finds association rules like 'Roads + Drainage issues often appear together' — helping municipal planners prioritize infrastructure investments and dispatch teams more efficiently.",
        "category": "Technical", "tags": ["market basket", "apriori", "association", "co-occur", "pattern"]
    },
    {
        "question": "How do I submit a garbage complaint?",
        "answer": "For garbage/waste complaints, describe the location where garbage is not collected or dumped illegally. Specify the duration (e.g., 'uncollected for 3 days'). The system routes your complaint to the Solid Waste Management & Sanitation Board. Include a landmark for faster resolution.",
        "category": "Waste Management", "tags": ["garbage", "waste", "trash", "dustbin", "collection"]
    },
    {
        "question": "What is Named Entity Recognition in CivicSense?",
        "answer": "Named Entity Recognition (NER) in CivicSense automatically extracts 4 types of civic entities from complaint text: LOCATION (street, landmark, junction), INFRASTRUCTURE (streetlight, pothole, drainage, pipes), DURATION (how long the issue has existed), and DEPARTMENT (responsible municipal body). NER achieves 91.3% Precision and 87.5% Recall on annotated ground truth data.",
        "category": "Technical", "tags": ["ner", "entity", "location", "infrastructure", "extraction"]
    },
]


def _keyword_score(question: str, faq: Dict) -> float:
    """Simple keyword overlap scoring for retrieving relevant FAQs."""
    q_lower = question.lower()
    score = 0.0
    # Tag matching (higher weight)
    for tag in faq.get("tags", []):
        if tag in q_lower:
            score += 2.0
    # Question text similarity
    ratio = SequenceMatcher(None, q_lower, faq["question"].lower()).ratio()
    score += ratio * 3.0
    # Keyword from FAQ question
    for word in faq["question"].lower().split():
        if len(word) > 4 and word in q_lower:
            score += 0.5
    return score


class CivicQASystem:
    """
    Civic Question Answering System.
    - Generative QA via Gemini (preferred)
    - Extractive QA from FAQ knowledge base (fallback)
    """

    def __init__(self):
        self._gemini_model = None
        self._init_gemini()

    def _init_gemini(self):
        if HAS_GEMINI and GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                self._gemini_model = genai.GenerativeModel("gemini-1.5-flash")
            except Exception:
                self._gemini_model = None

    def answer(self, question: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Answer a civic governance question.
        Returns structured answer with source, confidence, and related FAQs.
        """
        if not question or not question.strip():
            return {"error": "Empty question provided."}

        q = question.strip()

        # Retrieve top-3 FAQ matches
        scored = [(faq, _keyword_score(q, faq)) for faq in CIVIC_FAQ_KB]
        scored.sort(key=lambda x: x[1], reverse=True)
        top_faqs = [f for f, s in scored[:3] if s > 0.5]

        # Build FAQ context string
        faq_context = ""
        if top_faqs:
            faq_context = "\n\n".join([
                f"Q: {f['question']}\nA: {f['answer']}" for f in top_faqs
            ])

        # 1. Gemini generative answer
        if self._gemini_model:
            result = self._gemini_answer(q, faq_context, context)
            if result:
                result["related_faqs"] = [
                    {"question": f["question"], "category": f["category"]} for f in top_faqs
                ]
                return result

        # 2. Extractive fallback — return best matching FAQ
        if top_faqs:
            best = top_faqs[0]
            return {
                "question": q,
                "answer": best["answer"],
                "source": "FAQ Knowledge Base (Extractive)",
                "confidence": min(scored[0][1] / 8.0, 0.92),
                "category": best["category"],
                "engine": "Extractive QA (BM25-style)",
                "related_faqs": [
                    {"question": f["question"], "category": f["category"]} for f in top_faqs[1:]
                ]
            }

        return {
            "question": q,
            "answer": "I don't have specific information about that. Please contact your local municipal office or submit a complaint through the CivicSense portal.",
            "source": "Default",
            "confidence": 0.0,
            "engine": "Fallback",
            "related_faqs": []
        }

    def _gemini_answer(self, question: str, faq_context: str, extra_context: Optional[str]) -> Optional[Dict[str, Any]]:
        ctx_block = f"\n\nAdditional context:\n{extra_context}" if extra_context else ""
        faq_block = f"\n\nRelevant knowledge base entries:\n{faq_context}" if faq_context else ""

        prompt = (
            "You are CivicSense AI, an expert assistant for civic governance, municipal complaints, and urban infrastructure.\n"
            "Answer the user's question accurately, helpfully, and concisely (2-4 sentences max).\n"
            "Focus on actionable civic information. If unsure, say so politely.\n"
            f"{faq_block}{ctx_block}\n\n"
            "Return ONLY a JSON object:\n"
            '{"answer": "...", "confidence": 0.0-1.0, "category": "General|Roads|Water Supply|Drainage|Streetlights|Waste Management|Sanitation|Traffic|Technical"}\n\n'
            f"Question: {question}"
        )
        try:
            resp = self._gemini_model.generate_content(prompt)
            raw = resp.text.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip().strip("`")
            data = json.loads(raw)
            return {
                "question": question,
                "answer": data.get("answer", ""),
                "confidence": float(data.get("confidence", 0.9)),
                "category": data.get("category", "General"),
                "source": "Generative QA",
                "engine": "Google Gemini 1.5 Flash (LLM)"
            }
        except Exception:
            return None

    def get_all_faqs(self) -> List[Dict]:
        """Return all FAQ entries for display."""
        return [
            {
                "question": f["question"],
                "answer": f["answer"],
                "category": f["category"],
                "tags": f["tags"]
            }
            for f in CIVIC_FAQ_KB
        ]


# Singleton
civic_qa = CivicQASystem()


if __name__ == "__main__":
    test_questions = [
        "How do I report a pothole?",
        "What languages can I submit my complaint in?",
        "How does the AI classify complaints?",
        "What is the resolution time for water issues?",
        "Who handles drainage problems in the city?",
    ]
    print("=" * 65)
    print("   CIVICSENSE QA SYSTEM DEMONSTRATION")
    print("=" * 65)
    for q in test_questions:
        res = civic_qa.answer(q)
        print(f"\nQ: {q}")
        print(f"A: {res['answer']}")
        print(f"   Source: {res['engine']} | Confidence: {res['confidence']*100:.0f}%")
