"""
CivicSense NLP Preprocessing Pipeline
Provides language-aware text cleaning, tokenization, civic abbreviation expansion,
meaning-preserving stopword filtering, and stem/lemma normalization.
"""

import re
import unicodedata
from typing import List, Dict, Any, Tuple

# Civic-specific abbreviation expansions
CIVIC_ABBREVIATIONS = {
    r"\brd\b": "road",
    r"\bst\b": "street",
    r"\bave\b": "avenue",
    r"\bpkwy\b": "parkway",
    r"\bblvd\b": "boulevard",
    r"\bopp\b": "opposite",
    r"\bnr\b": "near",
    r"\bb/w\b": "between",
    r"\bw/\b": "with",
    r"\bw/o\b": "without",
    r"\bdept\b": "department",
    r"\bgovt\b": "government",
    r"\bmcorp\b": "municipal corporation",
    r"\bhwy\b": "highway",
    r"\bjunc\b": "junction",
    r"\bhrs\b": "hours",
    r"\bwks\b": "weeks",
    r"\bmos\b": "months",
    r"\byday\b": "yesterday"
}

# Standard English stopwords excluding civic critical tokens (negations, durations, locations)
STANDARD_STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "by", "could", "did", "do", "does", "doing", "down", "during",
    "each", "few", "for", "from", "further", "had", "has", "have", "having", "he",
    "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in",
    "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself",
    "of", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out",
    "over", "own", "same", "she", "should", "so", "some", "such", "than", "that",
    "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
    "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
    "will", "with", "you", "your", "yours", "yourself", "yourselves"
}

# Critical civic tokens that must NEVER be removed as stopwords
CRITICAL_CIVIC_PRESERVED_WORDS = {
    "no", "not", "off", "out", "broken", "burst", "dead", "none", "without",
    "water", "drain", "sewer", "light", "road", "pothole", "garbage", "trash",
    "leak", "stench", "smell", "flood", "overflow", "traffic", "signal",
    "day", "days", "night", "nights", "week", "weeks", "month", "months", "hours",
    "yesterday", "daily", "since", "two", "three", "four", "five", "six", "seven"
}

ACTIVE_STOPWORDS = STANDARD_STOPWORDS - CRITICAL_CIVIC_PRESERVED_WORDS


def expand_abbreviations(text: str) -> str:
    """Expands common urban and civic complaint abbreviations."""
    for pattern, replacement in CIVIC_ABBREVIATIONS.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def clean_special_characters(text: str) -> str:
    """Standardizes punctuation and removes disruptive noisy symbols while preserving language scripts."""
    text = unicodedata.normalize("NFKC", text)
    # Remove emojis and bizarre control symbols
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]", " ", text)
    # Normalize multiple punctuation marks to single dot/space
    text = re.sub(r"[\!@#$%^&*()_+=\[\]{};:'\"\\|<>/?~`]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def simple_lemmatize(token: str) -> str:
    """Robust rule-based inflectional lemmatizer for English civic vocabulary."""
    w = token.lower()
    # Common noun plurals
    if w.endswith("ies") and len(w) > 4:
        return w[:-3] + "y"
    if w.endswith("es") and len(w) > 4 and (w.endswith("shes") or w.endswith("ches") or w.endswith("sses") or w.endswith("xes")):
        return w[:-2]
    if w.endswith("s") and not w.endswith("ss") and len(w) > 3:
        # Avoid changing 'days' -> 'day', 'lights' -> 'light', 'potholes' -> 'pothole'
        return w[:-1]
    # Common verb inflections
    if w.endswith("ing") and len(w) > 5:
        base = w[:-3]
        if base.endswith("ll") or base.endswith("tt") or base.endswith("pp") or base.endswith("mm") or base.endswith("gg"):
            return base[:-1]
        return base
    if w.endswith("ed") and len(w) > 4:
        return w[:-2]
    return w


def tokenize_text(text: str) -> List[str]:
    """Tokenizes text supporting English, Tamil, and alphanumeric combinations."""
    # Matches words in Latin, Tamil (\u0B80-\u0BFF), and digits
    tokens = re.findall(r"[\u0B80-\u0BFF\w]+", text)
    return tokens


def preprocess_text(text: str, remove_stopwords: bool = True, lemmatize: bool = True) -> str:
    """
    Complete NLP Preprocessing Pipeline:
    1. Lowercasing (Latin characters)
    2. Abbreviation expansion
    3. Special character handling
    4. Tokenization
    5. Meaning-preserving stopword filtering
    6. Lemmatization
    7. Normalized reconstructed text string
    """
    if not text or not isinstance(text, str):
        return ""
        
    expanded = expand_abbreviations(text)
    cleaned = clean_special_characters(expanded)
    tokens = tokenize_text(cleaned)
    
    processed_tokens = []
    for token in tokens:
        # Check if Tamil script
        is_tamil = any("\u0B80" <= ch <= "\u0BFF" for ch in token)
        
        if is_tamil:
            # Preserve Tamil word intact
            processed_tokens.append(token)
            continue
            
        token_lower = token.lower()
        
        if remove_stopwords and token_lower in ACTIVE_STOPWORDS:
            continue
            
        if lemmatize:
            lemma = simple_lemmatize(token_lower)
            processed_tokens.append(lemma)
        else:
            processed_tokens.append(token_lower)
            
    return " ".join(processed_tokens)


def demonstrate_preprocessing(sample_complaints: List[str]) -> List[Dict[str, str]]:
    """Demonstrates Before vs After transformation for academic evaluation."""
    demonstrations = []
    for raw in sample_complaints:
        processed = preprocess_text(raw)
        demonstrations.append({
            "original_complaint": raw,
            "preprocessed_output": processed
        })
    return demonstrations


if __name__ == "__main__":
    samples = [
        "There is a huge pothole near the bus stand and it has been causing problems for people for the past two weeks.",
        "The streetlight nr our college has NOT been working for 4 days!!",
        "No water supply in Flat B-12 since yesterday morning, urgent help needed.",
        "Bus stand pakkathula streetlight 4 days ah work aagala.",
        "எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை."
    ]
    demos = demonstrate_preprocessing(samples)
    for d in demos:
        print("\n[BEFORE]:", d["original_complaint"])
        print("[AFTER] :", d["preprocessed_output"])
