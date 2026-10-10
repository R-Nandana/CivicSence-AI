"""
CivicSense NLP Concept 3: Multilingual NLP
Provides Language Detection for English, Tamil, and Tanglish (Code-Mixed Tamil-English),
preserves original text, and maps domain expressions into common processing representations.
"""

import re
from typing import Dict, Any, Tuple

# Tanglish Lexicon & Phonological Markers
TANGLISH_CIVIC_MARKERS = {
    # Civic nouns & verbs in Romanized Tamil
    r"\bpakkathula\b": "near",
    r"\bkitta\b": "near",
    r"\barugil\b": "near",
    r"\baagala\b": "not working",
    r"\bvelai\s*seiyala\b": "not working",
    r"\bwork\s*aagala\b": "not working",
    r"\bvarala\b": "not coming",
    r"\bvaravillai\b": "not coming",
    r"\birukku\b": "is there",
    r"\biruku\b": "is there",
    r"\bperiya\b": "huge",
    r"\bchinna\b": "small",
    r"\bpallam\b": "pothole",
    r"\broatula\b": "on the road",
    r"\broadla\b": "on the road",
    r"\btherula\b": "on the street",
    r"\bstreetla\b": "on the street",
    r"\bveetla\b": "in the house",
    r"\bromba\b": "very severe",
    r"\bkuppai\b": "garbage waste",
    r"\bthanni\b": "drinking water",
    r"\bkudineer\b": "drinking water",
    r"\bsaakadai\b": "drainage sewer",
    r"\bvilakku\b": "streetlight",
    r"\beriyala\b": "light not working",
    r"\bpannunga\b": "please resolve",
    r"\bmatranga\b": "not doing",
    r"\bnaala\b": "days",
    r"\bnaatkal\b": "days",
    r"\bvaram\b": "week"
}

# Native Tamil Unicode Dictionary to Common Civic Concept Mapping
TAMIL_SCRIPT_CIVIC_MAPPING = {
    r"குடிநீர்|தண்ணீர்|தண்ணி": "water supply drinking water",
    r"வரவில்லை|வரல": "not coming no supply",
    r"தெருவிளக்கு|விளக்கு": "streetlight street light",
    r"எரியவில்லை|வேலை செய்யவில்லை": "not working off",
    r"பள்ளம்|ரோடு|சாலை": "pothole road damage",
    r"சாக்கடை|கழிவுநீர்|வடிகால்": "drainage sewer overflow",
    r"குப்பை|கழிவு": "garbage waste uncollected",
    r"போக்குவரத்து": "traffic congestion",
    r"மூன்று\s*நாட்களாக|3\s*நாட்களாக": "for three days",
    r"நான்கு\s*நாட்களாக|4\s*நாட்களாக": "for four days",
    r"இரண்டு\s*நாட்களாக|2\s*நாட்களாக": "for two days",
    r"ஒரு\s*வாரமாக": "for one week",
    r"அருகில்|பக்கத்தில்": "near",
    r"பேருந்து\s*நிலையம்|பஸ்\s*ஸ்டாண்ட்": "bus stand",
    r"எங்கள்\s*பகுதியில்": "in our area locality"
}


class MultilingualProcessor:
    """Handles Language Detection and Multilingual Normalization."""

    def detect_language(self, text: str) -> str:
        """
        Detects whether complaint is in English, Tamil, or Tanglish.
        1. Checks for Tamil Unicode Script (\u0B80-\u0BFF)
        2. Checks for Tanglish phonetic/lexical markers
        3. Default to English
        """
        if not text or not isinstance(text, str):
            return "English"
            
        # 1. Tamil Script Detection: Count Tamil characters
        tamil_chars = sum(1 for ch in text if "\u0B80" <= ch <= "\u0BFF")
        if tamil_chars >= 2:
            return "Tamil"
            
        # 2. Tanglish Detection: Check for Tamil transliterated civic markers
        text_lower = text.lower()
        tanglish_matches = 0
        for pattern in TANGLISH_CIVIC_MARKERS:
            if re.search(pattern, text_lower):
                tanglish_matches += 1
                
        # Tanglish suffix regex: strictly match multi-syllable Tamil markers
        tanglish_suffix_pattern = r"\b[a-zA-Z]{3,}(?:pakkathula|aagala|aaguthu|panranga|pannunga|irukku|iruku|varala)\b"
        if len(re.findall(tanglish_suffix_pattern, text_lower)) >= 1:
            tanglish_matches += 1
            
        if tanglish_matches >= 1:
            return "Tanglish"
            
        return "English"

    def normalize_multilingual(self, text: str, detected_language: str) -> Tuple[str, str]:
        """
        Preserves original text while generating a normalized processing representation.
        Returns (original_text, normalized_processing_text).
        """
        if not text:
            return "", ""
            
        normalized = text
        
        if detected_language == "Tamil":
            for pattern, replacement in TAMIL_SCRIPT_CIVIC_MAPPING.items():
                normalized = re.sub(pattern, replacement, normalized)
                
        elif detected_language == "Tanglish":
            for pattern, replacement in TANGLISH_CIVIC_MARKERS.items():
                normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
                
        # Clean extra spaces
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return text, normalized


multilingual_processor = MultilingualProcessor()


if __name__ == "__main__":
    test_cases = [
        "The streetlight near the bus stand has been off for four days.",
        "எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை.",
        "Bus stand pakkathula streetlight 4 days ah work aagala.",
        "Periya pothole roatula irukku near Anna Nagar.",
        "Saakadai manhole overflow aaguthu opposite school."
    ]
    
    print("================ MULTILINGUAL PROCESSOR TEST ================")
    for c in test_cases:
        lang = multilingual_processor.detect_language(c)
        orig, norm = multilingual_processor.normalize_multilingual(c, lang)
        print(f"\nOriginal   : {orig}")
        print(f"Detected   : {lang}")
        print(f"Normalized : {norm}")
