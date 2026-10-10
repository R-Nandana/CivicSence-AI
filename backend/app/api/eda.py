"""
CivicSense Exploratory Data Analysis (EDA) Module
Calculates comprehensive dataset statistics, class balance, vocabulary frequencies,
text length distributions, and location patterns.
"""

import os
import json
import csv
import re
from collections import Counter
from typing import Dict, Any, List

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(ROOT_DIR, "data")
PROCESSED_JSON_PATH = os.path.join(DATA_DIR, "processed", "civic_complaints_processed.json")


def perform_eda(records: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generates complete EDA summary report and numerical distributions."""
    if records is None:
        if os.path.exists(PROCESSED_JSON_PATH):
            with open(PROCESSED_JSON_PATH, "r", encoding="utf-8") as f:
                records = json.load(f)
        else:
            records = []
            
    total_records = len(records)
    if total_records == 0:
        return {"error": "No records found in processed dataset."}
        
    sample_keys = list(records[0].keys())
    
    # 1. Missing Value Analysis
    missing_counts = {k: 0 for k in sample_keys}
    for r in records:
        for k in sample_keys:
            val = r.get(k)
            if val is None or str(val).strip() == "" or str(val) == "Not Specified":
                missing_counts[k] += 1
                
    # 2. Category Distribution & Class Balance
    categories = [r.get("category", "Unknown") for r in records]
    cat_counts = Counter(categories)
    cat_distribution = dict(cat_counts.most_common())
    
    # Class imbalance ratio (majority vs minority class)
    max_cat_count = max(cat_counts.values()) if cat_counts else 1
    min_cat_count = min(cat_counts.values()) if cat_counts else 1
    imbalance_ratio = round(max_cat_count / min_cat_count, 2)
    
    # 3. Complaint Length Distribution
    char_lengths = [len(r.get("original_text", "")) for r in records]
    word_lengths = [len(r.get("original_text", "").split()) for r in records]
    
    avg_char_len = round(sum(char_lengths) / len(char_lengths), 2)
    avg_word_len = round(sum(word_lengths) / len(word_lengths), 2)
    min_word_len = min(word_lengths)
    max_word_len = max(word_lengths)
    
    # 4. Word Frequency (Top Vocabulary)
    all_words = []
    stop_tokens = {"the", "and", "is", "for", "in", "to", "of", "a", "at", "it", "has", "been", "on", "with", "this", "that", "our", "near", "past"}
    for r in records:
        words = re.findall(r"\b[a-zA-Z]{3,}\b", r.get("original_text", "").lower())
        for w in words:
            if w not in stop_tokens:
                all_words.append(w)
    top_words = dict(Counter(all_words).most_common(20))
    
    # 5. Location / Borough Distribution
    boroughs = [r.get("borough", "Unknown") for r in records if r.get("borough")]
    borough_distribution = dict(Counter(boroughs).most_common(10))
    
    # 6. Status Breakdown
    statuses = [r.get("status", "New") for r in records]
    status_distribution = dict(Counter(statuses).most_common())
    
    # 7. Word length bins for histogram visualization
    length_bins = {"1-10 words": 0, "11-20 words": 0, "21-30 words": 0, "31-40 words": 0, "40+ words": 0}
    for w_len in word_lengths:
        if w_len <= 10:
            length_bins["1-10 words"] += 1
        elif w_len <= 20:
            length_bins["11-20 words"] += 1
        elif w_len <= 30:
            length_bins["21-30 words"] += 1
        elif w_len <= 40:
            length_bins["31-40 words"] += 1
        else:
            length_bins["40+ words"] += 1

    eda_summary = {
        "dataset_shape": {
            "total_records": total_records,
            "total_columns": len(sample_keys),
            "columns": sample_keys
        },
        "missing_values": missing_counts,
        "category_distribution": cat_distribution,
        "class_imbalance": {
            "imbalance_ratio": imbalance_ratio,
            "majority_class": cat_counts.most_common(1)[0] if cat_counts else None,
            "minority_class": cat_counts.most_common()[-1] if cat_counts else None,
            "assessment": "Balanced dataset across civic service domains." if imbalance_ratio < 4.0 else "Moderate class imbalance handled via weighted scoring."
        },
        "text_statistics": {
            "average_character_length": avg_char_len,
            "average_word_length": avg_word_len,
            "min_word_length": min_word_len,
            "max_word_length": max_word_len,
            "word_length_histogram": length_bins
        },
        "top_frequent_words": top_words,
        "borough_distribution": borough_distribution,
        "status_distribution": status_distribution
    }
    
    return eda_summary


if __name__ == "__main__":
    summary = perform_eda()
    print("================ CIVICSENSE EDA SUMMARY ================")
    print(json.dumps(summary, indent=2))
