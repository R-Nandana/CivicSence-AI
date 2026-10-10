"""
CivicSense NLP — LLM-Powered Multilingual Module (Gemini)
Concept 2 (Enhanced): Universal language detection & translation using Google Gemini.
Accepts ANY language (100+ languages) -> English.
Falls back to deep_translator / regex-based approach if Gemini is unavailable.
"""

import os
import re
import json
from typing import Dict, Any, Optional

# Gemini SDK
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# deep_translator fallback
try:
    from deep_translator import GoogleTranslator
    HAS_DEEP = True
except ImportError:
    HAS_DEEP = False


GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

TANGLISH_MARKERS = [
    "pakkathula", "kitta", "arugil", "aagala", "velai", "varala",
    "irukku", "iruku", "periya", "chinna", "pallam", "roatula",
    "roadla", "therula", "romba", "kuppai", "thanni", "kudineer",
    "saakadai", "vilakku", "eriyala", "pannunga", "naala", "naatkal", "varam"
]


def _is_tanglish(text: str) -> bool:
    lower = text.lower()
    return sum(1 for m in TANGLISH_MARKERS if m in lower) >= 1


def _has_tamil_script(text: str) -> bool:
    return sum(1 for ch in text if "\u0B80" <= ch <= "\u0BFF") >= 2


class LLMMultilingualProcessor:
    """
    Universal multilingual processor powered by Google Gemini 1.5 Flash.
    Detects language + translates to English for ANY language input.
    Falls back gracefully when Gemini API key is unavailable.
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

    def detect_and_translate(self, text: str) -> Dict[str, Any]:
        """
        Main entry: detect language and translate to English.
        Priority: Gemini LLM -> deep_translator -> Rule-based -> Identity
        """
        if not text or not text.strip():
            return self._build_result(text, text, "English", "identity", 1.0, False)

        clean = text.strip()

        # Fast-path plain English
        if not _has_tamil_script(clean) and not _is_tanglish(clean):
            ascii_ratio = sum(1 for c in clean if ord(c) < 128) / max(len(clean), 1)
            if ascii_ratio > 0.92:
                return self._build_result(clean, clean, "English", "identity", 1.0, False)

        # 1. Gemini LLM
        if self._gemini_model:
            result = self._gemini_translate(clean)
            if result:
                return result

        # 2. Tanglish rule-based
        if _is_tanglish(clean):
            translated = self._tanglish_fallback(clean)
            return self._build_result(clean, translated, "Tanglish", "Domain Rule-Based MT", 0.88, True)

        # 3. Tamil script — deep_translator
        if _has_tamil_script(clean) and HAS_DEEP:
            try:
                translated = GoogleTranslator(source="ta", target="en").translate(clean)
                if translated:
                    return self._build_result(clean, translated, "Tamil", "Google Translate (deep_translator)", 0.95, True)
            except Exception:
                pass

        # 4. Auto-detect — deep_translator
        if HAS_DEEP:
            try:
                translated = GoogleTranslator(source="auto", target="en").translate(clean)
                if translated:
                    return self._build_result(clean, translated, "Auto-detected", "Google Translate (deep_translator)", 0.90, True)
            except Exception:
                pass

        return self._build_result(clean, clean, "Unknown", "identity", 0.5, False)

    def get_language_info(self, text: str) -> Dict[str, Any]:
        """Detect language only (no translation)."""
        if _has_tamil_script(text):
            return {"language": "Tamil", "confidence": 0.99, "script": "Tamil Unicode"}
        if _is_tanglish(text):
            return {"language": "Tanglish", "confidence": 0.90, "script": "Latin (Code-Mixed)"}

        if self._gemini_model:
            prompt = (
                "Identify the language of this text. Reply ONLY with a JSON object like: "
                '{"language": "Hindi", "confidence": 0.98, "script": "Devanagari"}.\n'
                f"Text: {text[:300]}"
            )
            try:
                resp = self._gemini_model.generate_content(prompt)
                raw = resp.text.strip()
                raw = re.sub(r"```(?:json)?", "", raw).strip().strip("`")
                return json.loads(raw)
            except Exception:
                pass

        ascii_ratio = sum(1 for c in text if ord(c) < 128) / max(len(text), 1)
        lang = "English" if ascii_ratio > 0.9 else "Unknown"
        return {"language": lang, "confidence": 0.7, "script": "Latin"}

    def _gemini_translate(self, text: str) -> Optional[Dict[str, Any]]:
        prompt = (
            "You are a multilingual civic complaint translator for a government NLP system.\n"
            "Task:\n"
            "1. Identify the language of the complaint (be specific, e.g. 'Hindi', 'Tamil', 'French', 'Tanglish', 'English').\n"
            "2. Translate it to clear, standard English if it is not already English.\n"
            "3. Return ONLY a valid JSON object with these exact keys:\n"
            '   {"detected_language": "...", "translated_text": "...", "confidence": 0.0-1.0, "notes": "..."}\n'
            "If already English, set translated_text = original text and confidence = 1.0.\n\n"
            f"Complaint: {text[:500]}"
        )
        try:
            resp = self._gemini_model.generate_content(prompt)
            raw = resp.text.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip().strip("`")
            data = json.loads(raw)
            lang = data.get("detected_language", "Unknown")
            translated = data.get("translated_text", text)
            confidence = float(data.get("confidence", 0.95))
            is_translated = lang.lower() not in ("english",)
            return self._build_result(
                text, translated, lang,
                "Google Gemini 1.5 Flash (LLM)",
                confidence, is_translated
            )
        except Exception:
            return None

    def _tanglish_fallback(self, text: str) -> str:
        RULES = {
            "pakkathula": "near", "kitta": "near", "aagala": "not working",
            "work aagala": "not working", "varala": "not coming", "irukku": "is there",
            "iruku": "is there", "periya": "big", "chinna": "small", "pallam": "pothole",
            "roatula": "on the road", "roadla": "on the road", "therula": "on the street",
            "romba": "very", "kuppai": "garbage", "thanni": "water",
            "kudineer": "drinking water", "saakadai": "drainage", "vilakku": "streetlight",
            "eriyala": "not working", "pannunga": "please fix", "naala": "days",
            "naatkal": "days", "varam": "week",
        }
        result = text
        for src, tgt in RULES.items():
            result = re.sub(re.escape(src), tgt, result, flags=re.IGNORECASE)
        return re.sub(r"\s+", " ", result).strip()

    @staticmethod
    def _build_result(
        original: str, translated: str, lang: str,
        engine: str, confidence: float, is_translated: bool
    ) -> Dict[str, Any]:
        return {
            "original_text": original,
            "translated_text": translated,
            "detected_language": lang,
            "engine": engine,
            "confidence": confidence,
            "is_translated": is_translated,
            "supported_languages": "100+ languages via Google Gemini 1.5 Flash"
        }


# Singleton
llm_multilingual = LLMMultilingualProcessor()


if __name__ == "__main__":
    samples = [
        "The streetlight near bus stand has been off for 3 days.",
        "\u0b8e\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0baa\u0b95\u0bc1\u0ba4\u0bbf\u0baf\u0bbf\u0bb2\u0bcd \u0bae\u0bc2\u0ba9\u0bcd\u0bb1\u0bc1 \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bbe\u0b95 \u0b95\u0bc1\u0b9f\u0bbf\u0ba8\u0bc0\u0bb0\u0bcd \u0bb5\u0bb0\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8.",
        "Bus stand pakkathula streetlight work aagala 4 days.",
        "\u0939\u092e\u093e\u0930\u0947 \u0907\u0932\u093e\u0915\u0947 \u092e\u0947\u0902 3 \u0926\u093f\u0928\u094b\u0902 \u0938\u0947 \u092a\u093e\u0928\u0940 \u0928\u0939\u0940\u0902 \u0906 \u0930\u0939\u093e \u0939\u0948\u0964",
        "Notre rue est pleine de nids-de-poule depuis une semaine.",
        "Hay baches enormes en la calle principal desde hace dias.",
    ]
    print("=" * 65)
    print("   LLM MULTILINGUAL PROCESSOR - GEMINI UNIVERSAL TRANSLATION")
    print("=" * 65)
    for s in samples:
        r = llm_multilingual.detect_and_translate(s)
        print(f"\n[Input]    ({r['detected_language']}): {r['original_text']}")
        print(f"[English]: {r['translated_text']}")
        print(f"[Engine]:  {r['engine']} | Confidence: {r['confidence']*100:.0f}%")
