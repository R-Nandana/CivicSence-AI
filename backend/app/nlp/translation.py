"""
CivicSense NLP: Machine Translation Module
Translates citizen complaints submitted in non-English languages (Native Tamil, Tanglish,
Hindi, regional languages) into standard English for downstream classification,
NER processing, and municipal officer review.
"""

import re
import sys
from typing import Dict, Any, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


try:
    from deep_translator import GoogleTranslator
    HAS_DEEP_TRANSLATOR = True
except ImportError:
    HAS_DEEP_TRANSLATOR = False

# High-fidelity domain parallel dictionary for civic issues (ensures offline reliability)
PARALLEL_CIVIC_DICTIONARY = {
    # Tamil script to English
    "குடிநீர்": "drinking water",
    "தண்ணீர்": "water",
    "தண்ணி": "water",
    "வரவில்லை": "is not coming",
    "வரல": "is not coming",
    "தெருவிளக்கு": "streetlight",
    "விளக்கு": "light",
    "எரியவில்லை": "is not working",
    "வேலை செய்யவில்லை": "is not functioning",
    "பள்ளம்": "pothole",
    "ரோடு": "road",
    "சாலை": "road",
    "சாக்கடை": "drainage sewage",
    "கழிவுநீர்": "wastewater sewage",
    "வடிகால்": "drainage",
    "குப்பை": "garbage waste",
    "கழிவு": "waste",
    "போக்குவரத்து": "traffic congestion",
    "நெரிசல்": "congestion",
    "நாட்களாக": "days",
    "மூன்று நாட்களாக": "for three days",
    "நான்கு நாட்களாக": "for four days",
    "இரண்டு நாட்களாக": "for two days",
    "ஒரு வாரமாக": "for one week",
    "அருகில்": "near",
    "பக்கத்தில்": "near",
    "பேருந்து நிலையம்": "bus stop / bus station",
    "எங்கள் பகுதியில்": "in our neighborhood / area",
    "உடனடியாக சீரமைக்கவும்": "please repair immediately",
    "நடவடிக்கை எடுக்கவும்": "please take action",

    # Tanglish (Romanized Tamil) to English
    "pakkathula": "near",
    "kitta": "near",
    "arugil": "near",
    "aagala": "not functioning",
    "work aagala": "not working",
    "velai seiyala": "not working",
    "varala": "not coming",
    "varavillai": "not coming",
    "irukku": "there is",
    "iruku": "there is",
    "periya": "large",
    "chinna": "small",
    "pallam": "pothole",
    "roatula": "on the road",
    "roadla": "on the road",
    "therula": "on the street",
    "streetla": "on the street",
    "veetla": "in the house",
    "romba": "very severe",
    "kuppai": "garbage waste",
    "thanni": "drinking water",
    "kudineer": "drinking water",
    "saakadai": "drainage sewer",
    "vilakku": "streetlight",
    "eriyala": "light not burning / off",
    "pannunga": "please resolve",
    "matranga": "not doing",
    "naala": "days",
    "naatkal": "days",
    "varam": "week"
}


class MachineTranslator:
    """CivicSense Machine Translation Engine supporting Neural & Fallback Translation."""

    def __init__(self):
        self._online_enabled = HAS_DEEP_TRANSLATOR

    def translate_to_english(self, text: str, source_lang: Optional[str] = None) -> Dict[str, Any]:
        """
        Translates text to English.
        Detects if input is already English, Tamil, Tanglish, or other.
        Returns a rich structured translation result.
        """
        if not text or not text.strip():
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": "English",
                "target_language": "English",
                "engine": "identity",
                "confidence": 1.0,
                "is_translated": False
            }

        cleaned_text = text.strip()

        # Detect Tamil Unicode Script
        tamil_char_count = sum(1 for ch in cleaned_text if "\u0B80" <= ch <= "\u0BFF")
        is_tamil = tamil_char_count >= 2

        # Detect Tanglish
        is_tanglish = False
        lower_text = cleaned_text.lower()
        tanglish_matches = [k for k in PARALLEL_CIVIC_DICTIONARY if k in lower_text and not ("\u0B80" <= k[0] <= "\u0BFF")]
        if len(tanglish_matches) >= 1:
            is_tanglish = True

        detected = "Tamil" if is_tamil else ("Tanglish" if is_tanglish else (source_lang or "English"))

        # If already standard English without non-English markers
        if detected == "English" and not is_tamil and not is_tanglish:
            return {
                "original_text": cleaned_text,
                "translated_text": cleaned_text,
                "source_language": "English",
                "target_language": "English",
                "engine": "identity",
                "confidence": 1.0,
                "is_translated": False
            }

        # 1. Try Neural Online Machine Translation (with fast timeout fallback)
        if HAS_DEEP_TRANSLATOR:
            try:
                import socket
                orig_timeout = socket.getdefaulttimeout()
                socket.setdefaulttimeout(4.0)
                try:
                    src_code = "ta" if is_tamil else "auto"
                    if source_lang and source_lang.lower() not in ("auto", "tanglish"):
                        lang_map = {
                            "tamil": "ta", "hindi": "hi", "telugu": "te", "kannada": "kn",
                            "malayalam": "ml", "bengali": "bn", "marathi": "mr", "gujarati": "gu",
                            "punjabi": "pa", "urdu": "ur", "spanish": "es", "french": "fr",
                            "german": "de", "arabic": "ar", "chinese": "zh-CN", "japanese": "ja"
                        }
                        src_code = lang_map.get(source_lang.lower(), "auto")
                    translator = GoogleTranslator(source=src_code, target="en")
                    translated = translator.translate(cleaned_text)
                    if translated and translated.strip():
                        return {
                            "original_text": cleaned_text,
                            "translated_text": translated.strip(),
                            "source_language": detected,
                            "target_language": "English",
                            "engine": "Neural Machine Translation (Google MT)",
                            "confidence": 0.96,
                            "is_translated": True
                        }
                finally:
                    socket.setdefaulttimeout(orig_timeout)
            except Exception:
                pass  # Fallback directly to domain dictionary without blocking

        # 2. Tanglish / Tamil Hybrid Domain Machine Translation
        translated = cleaned_text
        applied_rules = 0

        # Replace domain segments
        for src, target in PARALLEL_CIVIC_DICTIONARY.items():
            pattern = re.compile(re.escape(src), re.IGNORECASE)
            if pattern.search(translated):
                translated = pattern.sub(target, translated)
                applied_rules += 1

        # Clean spaces and grammar
        translated = re.sub(r"\s+", " ", translated).strip()
        # Capitalize first letter
        if translated:
            translated = translated[0].upper() + translated[1:]

        return {
            "original_text": cleaned_text,
            "translated_text": translated,
            "source_language": detected,
            "target_language": "English",
            "engine": "Civic Domain Cross-Lingual Machine Translation",
            "confidence": 0.92 if applied_rules > 0 else 0.85,
            "is_translated": True
        }


machine_translator = MachineTranslator()


if __name__ == "__main__":
    test_complaints = [
        "The streetlight near the bus stand has been off for four days.",
        "எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை.",
        "Bus stand pakkathula streetlight 4 days ah work aagala.",
        "Periya pothole roatula irukku near Anna Nagar.",
        "சாக்கடை கழிவுநீர் பெருக்கெடுத்து ஓடுகிறது."
    ]

    print("=" * 60)
    print("      CIVICSENSE MACHINE TRANSLATION DEMO")
    print("=" * 60)
    for sample in test_complaints:
        res = machine_translator.translate_to_english(sample)
        print(f"\n[Source] ({res['source_language']}) : {res['original_text']}")
        print(f"[Target] (English) : {res['translated_text']}")
        print(f"[Engine]           : {res['engine']} (Confidence: {res['confidence'] * 100:.1f}%)")
