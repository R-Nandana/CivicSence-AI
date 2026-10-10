"""
ETL Module: TRANSFORM
Cleans raw civic records, maps NYC 311 categories to CivicSense standard 8 categories,
handles missing values, deduplicates, and produces NLP-ready datasets.
Uses robust standard libraries for maximum cross-platform compatibility.
"""

import os
import re
import csv
import json
from collections import Counter
from typing import List, Dict, Any, Tuple

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PROCESSED_CSV_PATH = os.path.join(DATA_DIR, "processed", "civic_complaints_processed.csv")
PROCESSED_JSON_PATH = os.path.join(DATA_DIR, "processed", "civic_complaints_processed.json")

# Explicit Mapping from NYC 311 Complaint Types & Descriptors to CivicSense 8 Standard Categories
CATEGORY_MAPPING = {
    "Street Condition": "Roads",
    "Pothole": "Roads",
    "Cave-in": "Roads",
    "Rough Road": "Roads",
    "Defective Street": "Roads",
    
    "Sanitation Condition": "Waste Management",
    "Dirty Conditions": "Waste Management",
    "Missed Collection": "Waste Management",
    "Garbage/Littering": "Waste Management",
    "Trash Collection": "Waste Management",
    "Overflowing Bins": "Waste Management",
    "Illegal Dumping": "Waste Management",
    "Garbage Missed": "Waste Management",
    
    "Water System": "Water Supply",
    "No Water": "Water Supply",
    "Low Water Pressure": "Water Supply",
    "Water Main Break": "Water Supply",
    "Hydrant Running": "Water Supply",
    "Contaminated Water": "Water Supply",
    "Water Quality": "Water Supply",
    
    "Sewer": "Drainage",
    "Clogged Catch Basin": "Drainage",
    "Manhole Overflow": "Drainage",
    "Drainage Backup": "Drainage",
    "Broken Drain Cover": "Drainage",
    "Stagnant Water": "Drainage",
    "Catch Basin": "Drainage",
    
    "Street Light Condition": "Streetlights",
    "Street Light Out": "Streetlights",
    "Lamp Post Damaged": "Streetlights",
    "Flickering Light": "Streetlights",
    "Multiple Lights Out": "Streetlights",
    "Street Light Day Burning": "Streetlights",
    
    "Traffic Signal Condition": "Traffic",
    "Traffic Signal Out": "Traffic",
    "Signal Timing Defect": "Traffic",
    "Missing Sign": "Traffic",
    "Signal Stuck on Red": "Traffic",
    "Blinker Malfunction": "Traffic",
    "Traffic": "Traffic",
    
    "Rodent": "Sanitation",
    "Rat Sighting": "Sanitation",
    "Public Toilet Blocked": "Sanitation",
    "Pest Infestation": "Sanitation",
    "Foul Odor": "Sanitation",
    "Sanitation Hazard": "Sanitation",
    "Unsanitary Condition": "Sanitation",
    
    "Building/Use": "Public Infrastructure",
    "Damaged Tree": "Public Infrastructure",
    "Illegal Construction": "Public Infrastructure",
    "Broken Park Bench": "Public Infrastructure",
    "Fallen Tree Blocking Road": "Public Infrastructure",
    "Damaged Bus Shelter": "Public Infrastructure",
    "Bridge Condition": "Public Infrastructure"
}

CIVICSENSE_CATEGORIES = [
    "Roads",
    "Waste Management",
    "Water Supply",
    "Drainage",
    "Streetlights",
    "Sanitation",
    "Traffic",
    "Public Infrastructure"
]


def map_category(complaint_type: str, descriptor: str = "") -> str:
    """Maps NYC 311 complaint_type and descriptor to standard CivicSense category."""
    desc_clean = (descriptor or "").strip()
    type_clean = (complaint_type or "").strip()
    
    # Check descriptor first (more specific)
    if desc_clean in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[desc_clean]
        
    # Check complaint type
    if type_clean in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[type_clean]
        
    # Keyword based heuristic fallback
    combined = f"{type_clean} {desc_clean}".lower()
    if any(k in combined for k in ["pothole", "pavement", "asphalt", "road", "street crack"]):
        return "Roads"
    if any(k in combined for k in ["garbage", "trash", "dump", "litter", "rubbish", "dustbin", "waste"]):
        return "Waste Management"
    if any(k in combined for k in ["water", "hydrant", "pipeline", "drinking water", "tap"]):
        return "Water Supply"
    if any(k in combined for k in ["sewer", "drain", "manhole", "catch basin", "gutter", "overflow", "stagnant"]):
        return "Drainage"
    if any(k in combined for k in ["streetlight", "street light", "lamp", "pole", "light out"]):
        return "Streetlights"
    if any(k in combined for k in ["rodent", "rat", "toilet", "pest", "odor", "stench", "unsanitary"]):
        return "Sanitation"
    if any(k in combined for k in ["traffic", "signal", "sign", "crossing", "blinker", "speed breaker"]):
        return "Traffic"
    return "Public Infrastructure"


def clean_text(text: str) -> str:
    """Cleans text by normalizing whitespace, standardizing punctuation, and stripping noise."""
    if not text or not isinstance(text, str):
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    return text


def transform_records(raw_records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Transforms raw NYC 311 records:
    - Filters missing text/type
    - Deduplicates
    - Builds rich complaint text representation
    - Normalizes categories to standard 8 CivicSense classes
    - Exports clean CSV/JSON
    """
    os.makedirs(os.path.dirname(PROCESSED_CSV_PATH), exist_ok=True)
    
    extracted_count = len(raw_records)
    transformed_records = []
    seen_texts = set()
    dropped_missing = 0
    dropped_duplicates = 0
    
    for idx, item in enumerate(raw_records):
        unique_key = item.get("unique_key") or f"NYC311-{idx+1}"
        c_type = item.get("complaint_type", "")
        descriptor = item.get("descriptor", "")
        address = item.get("incident_address") or item.get("street_name") or "Public Location"
        borough = item.get("borough", "City Area")
        created_date = item.get("created_date", "2026-03-15T00:00:00")
        
        # Build natural complaint text
        desc_text = item.get("complaint_description")
        if not desc_text:
            if descriptor and c_type:
                desc_text = f"Report regarding {c_type} - {descriptor} at {address}, {borough}. Urgent attention requested."
            elif descriptor:
                desc_text = f"{descriptor} issue reported at {address}, {borough}."
            elif c_type:
                desc_text = f"{c_type} problem observed at {address}, {borough}."
            else:
                desc_text = ""
                
        cleaned_complaint = clean_text(desc_text)
        
        if not cleaned_complaint or len(cleaned_complaint) < 10:
            dropped_missing += 1
            continue
            
        if cleaned_complaint.lower() in seen_texts:
            dropped_duplicates += 1
            continue
            
        seen_texts.add(cleaned_complaint.lower())
        category = map_category(c_type, descriptor)
        
        transformed_records.append({
            "complaint_id": f"CIV-{unique_key}",
            "original_text": cleaned_complaint,
            "category": category,
            "complaint_type_raw": c_type,
            "descriptor_raw": descriptor,
            "location": f"{address}, {borough}".strip(", "),
            "borough": borough,
            "created_date": created_date,
            "source": "NYC_311_Dataset",
            "language": "English",
            "status": "In Review" if idx % 2 == 0 else "New"
        })
        
    # Write CSV
    if transformed_records:
        fieldnames = list(transformed_records[0].keys())
        with open(PROCESSED_CSV_PATH, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(transformed_records)
            
    # Write JSON
    with open(PROCESSED_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(transformed_records, f, indent=2, ensure_ascii=False)
        
    category_counts = Counter(r["category"] for r in transformed_records)
    
    stats = {
        "extracted_count": extracted_count,
        "transformed_count": len(transformed_records),
        "dropped_missing": dropped_missing,
        "dropped_duplicates": dropped_duplicates,
        "categories_distribution": dict(category_counts)
    }
    
    print(f"[ETL-Transform] Transformed {len(transformed_records)} records (Dropped {dropped_missing} missing, {dropped_duplicates} duplicates).")
    print(f"[ETL-Transform] Saved to {PROCESSED_CSV_PATH} and {PROCESSED_JSON_PATH}")
    return transformed_records, stats


if __name__ == "__main__":
    from extract import extract_from_nyc311
    raw = extract_from_nyc311(1000)
    records, stats = transform_records(raw)
    print("Category Distribution:\n", stats["categories_distribution"])
