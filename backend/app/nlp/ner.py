"""
CivicSense NLP Concept 2: Named Entity Recognition (NER)
Extracts domain-specific civic entities:
- LOCATION
- INFRASTRUCTURE
- DURATION
- DEPARTMENT
"""

import re
from typing import List, Dict, Any, Set, Tuple

# Civic Infrastructure Gazetteers
INFRASTRUCTURE_PATTERNS = [
    r"\b(?:street\s*lights?|streetlamps?|lamp\s*posts?|electric\s*poles?|high\s*mast\s*lights?)\b",
    r"\b(?:potholes?|road\s*cracks?|pavements?|asphalts?|footpaths?|speed\s*breakers?|flyovers?|bridges?)\b",
    r"\b(?:water\s*pipes?|pipelines?|water\s*mains?|fire\s*hydrants?|borewells?|taps?|overhead\s*tanks?)\b",
    r"\b(?:drainage|manholes?|sewers?|catch\s*basins?|gutters?|storm\s*drains?|culverts?)\b",
    r"\b(?:garbage\s*bins?|dustbins?|trash\s*cans?|waste\s*containers?|dumpsters?)\b",
    r"\b(?:traffic\s*lights?|traffic\s*signals?|pedestrian\s*crossings?|zebra\s*crossings?|signal\s*timers?|sign\s*boards?)\b",
    r"\b(?:bus\s*shelters?|bus\s*stops?|park\s*benches?|playgrounds?|fences?|trees?|branches?)\b",
    r"\b(?:public\s*toilets?|restrooms?)\b"
]

# Civic Department Gazetteers & Patterns
DEPARTMENT_MAPPINGS = {
    "Roads": "Highways & Public Works Department (PWD)",
    "Waste Management": "Solid Waste Management & Sanitation Board",
    "Water Supply": "Municipal Water Supply & Distribution Board",
    "Drainage": "Underground Drainage & Sewerage Board (TWAD / DEP)",
    "Streetlights": "Electricity Distribution Board & Public Lighting Division",
    "Sanitation": "Public Health & Urban Sanitation Department",
    "Traffic": "Traffic Police & Urban Transit Operations",
    "Public Infrastructure": "Parks, Recreation & Municipal Infrastructure Division"
}

# Duration & Temporal Patterns
DURATION_PATTERNS = [
    r"\b(?:for\s+)?(?:the\s+)?(?:past|last)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:hours?|days?|nights?|weeks?|months?|years?)\b",
    r"\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:hours?|days?|nights?|weeks?|months?|years?)\s*(?:ah|aga|aaga)?\b",
    r"\b(?:since\s+)?(?:yesterday|last\s+night|this\s+morning|last\s+week|last\s+month|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b",
    r"\b(?:மூன்று\s+நாட்களாக|இரண்டு\s+நாட்களாக|ஒரு\s+வாரமாக|நேற்று\s+முதல்)\b"
]

# Location Indicators & Patterns
LOCATION_PREPOSITIONS = r"(?:near|at|opposite|opp|behind|in\s+front\s+of|along|around|beside|next\s+to|across|nr|pakkathula|kitta|arugil|munbu)"

LOCATION_SUFFIXES = r"(?:bus\s*stand|bus\s*stop|railway\s*station|metro\s*station|junction|cross|circle|nagar|colony|street|st|road|rd|avenue|ave|lane|pkwy|blvd|ward|market|bazaar|hospital|college|school|park|temple|church|mosque|bridge|flyover|hall|complex)"


class CivicNamedEntityRecognizer:
    """Extracts Location, Infrastructure, Duration, and Department entities."""
    
    def extract_entities(self, text: str, predicted_category: str = "") -> List[Dict[str, Any]]:
        """Extracts structured entities from civic complaint text."""
        if not text:
            return []
            
        entities = []
        text_lower = text.lower()
        extracted_spans: Set[Tuple[int, int]] = set()

        def is_overlapping(start: int, end: int) -> bool:
            for (s, e) in extracted_spans:
                if max(start, s) < min(end, e):
                    return True
            return False

        # 1. Extract DURATION
        for pattern in DURATION_PATTERNS:
            for match in re.finditer(pattern, text, flags=re.IGNORECASE):
                s, e = match.span()
                if not is_overlapping(s, e):
                    extracted_spans.add((s, e))
                    entities.append({
                        "entity_text": match.group(0).strip(),
                        "entity_type": "DURATION",
                        "start_char": s,
                        "end_char": e
                    })

        # 2. Extract INFRASTRUCTURE
        for pattern in INFRASTRUCTURE_PATTERNS:
            for match in re.finditer(pattern, text, flags=re.IGNORECASE):
                s, e = match.span()
                if not is_overlapping(s, e):
                    extracted_spans.add((s, e))
                    entities.append({
                        "entity_text": match.group(0).strip(),
                        "entity_type": "INFRASTRUCTURE",
                        "start_char": s,
                        "end_char": e
                    })

        # 3. Extract LOCATION via contextual cues (e.g. "near Gandhipuram bus stand", "at 5th Ave and 34th St")
        loc_regex_1 = rf"{LOCATION_PREPOSITIONS}\s+([A-Z0-9a-z\s\.\-]{{3,35}}?{LOCATION_SUFFIXES})"
        for match in re.finditer(loc_regex_1, text, flags=re.IGNORECASE):
            loc_val = match.group(1).strip()
            # remove trailing punctuation
            loc_val = re.sub(r"[\.,;:!?]+$", "", loc_val).strip()
            s, e = match.start(1), match.start(1) + len(loc_val)
            if not is_overlapping(s, e) and len(loc_val) >= 3:
                extracted_spans.add((s, e))
                entities.append({
                    "entity_text": loc_val,
                    "entity_type": "LOCATION",
                    "start_char": s,
                    "end_char": e
                })

        # Pattern 2: Standalone Landmark/Street (e.g. "5th Ave", "Gandhipuram bus stand", "Anna Nagar 2nd Street")
        loc_regex_2 = rf"\b([A-Z][a-zA-Z0-9\s]{{1,25}}?\s+{LOCATION_SUFFIXES})\b"
        for match in re.finditer(loc_regex_2, text, flags=re.IGNORECASE):
            loc_val = match.group(1).strip()
            loc_val = re.sub(r"[\.,;:!?]+$", "", loc_val).strip()
            s, e = match.span(1)
            if not is_overlapping(s, e) and len(loc_val) >= 4:
                extracted_spans.add((s, e))
                entities.append({
                    "entity_text": loc_val,
                    "entity_type": "LOCATION",
                    "start_char": s,
                    "end_char": e
                })

        # 4. Resolve Target DEPARTMENT
        if predicted_category and predicted_category in DEPARTMENT_MAPPINGS:
            dept_name = DEPARTMENT_MAPPINGS[predicted_category]
            entities.append({
                "entity_text": dept_name,
                "entity_type": "DEPARTMENT",
                "start_char": 0,
                "end_char": 0
            })

        return entities


civic_ner = CivicNamedEntityRecognizer()


if __name__ == "__main__":
    test_sentences = [
        ("The streetlight near Gandhipuram bus stand has been off for four nights.", "Streetlights"),
        ("There is a huge pothole near Anna Nagar junction causing accidents for the past two weeks.", "Roads"),
        ("Bus stand pakkathula streetlight 4 days ah work aagala.", "Streetlights"),
        ("Sewage manhole overflowing at Broadway & 72nd St since yesterday.", "Drainage"),
        ("No water supply near Flat B-12 for 3 days.", "Water Supply")
    ]
    
    for text, cat in test_sentences:
        ents = civic_ner.extract_entities(text, predicted_category=cat)
        print(f"\nText: \"{text}\"")
        for ent in ents:
            print(f"  -> {ent['entity_type'].ljust(15)}: {ent['entity_text']}")
