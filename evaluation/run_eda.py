"""
CivicSense EDA Generation Script
Executes full exploratory data analysis and prints detailed statistical breakdown.
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.app.api.eda import perform_eda


def run_eda_report():
    print("=================================================================")
    print("      CIVICSENSE EXPLORATORY DATA ANALYSIS (EDA) REPORT           ")
    print("=================================================================")
    
    summary = perform_eda()
    shape = summary["dataset_shape"]
    print(f"\n1. DATASET SHAPE & STRUCTURE:")
    print(f"   - Total Clean Records : {shape['total_records']}")
    print(f"   - Total Columns       : {shape['total_columns']}")
    print(f"   - Feature Names       : {', '.join(shape['columns'])}")
    
    print(f"\n2. MISSING VALUES ANALYSIS:")
    for col, count in summary["missing_values"].items():
        pct = round((count / shape['total_records']) * 100, 2)
        print(f"   - {col.ljust(22)}: {count} missing ({pct}%)")
        
    print(f"\n3. CATEGORY DISTRIBUTION (Target Variable):")
    for cat, count in summary["category_distribution"].items():
        bar = "#" * int(count / 15)
        print(f"   - {cat.ljust(22)}: {str(count).rjust(4)} records | {bar}")
        
    imb = summary["class_imbalance"]
    print(f"\n4. CLASS IMBALANCE EVALUATION:")
    print(f"   - Majority Class      : {imb['majority_class']}")
    print(f"   - Minority Class      : {imb['minority_class']}")
    print(f"   - Imbalance Ratio     : {imb['imbalance_ratio']}")
    print(f"   - Assessment          : {imb['assessment']}")
    
    stats = summary["text_statistics"]
    print(f"\n5. COMPLAINT TEXT LENGTH METRICS:")
    print(f"   - Avg Character Length: {stats['average_character_length']} chars")
    print(f"   - Avg Word Count      : {stats['average_word_length']} words")
    print(f"   - Min / Max Word Count: {stats['min_word_length']} / {stats['max_word_length']} words")
    
    print(f"\n6. COMPLAINT LENGTH HISTOGRAM:")
    for bin_name, cnt in stats["word_length_histogram"].items():
        bar = "=" * int(cnt / 15)
        print(f"   - {bin_name.ljust(15)}: {str(cnt).rjust(4)} | {bar}")
        
    print(f"\n7. TOP 15 VOCABULARY FREQUENCIES:")
    for word, cnt in list(summary["top_frequent_words"].items())[:15]:
        print(f"   - {word.ljust(15)}: {cnt} occurrences")
        
    print(f"\n8. BOROUGH / REGIONAL DISTRIBUTION:")
    for b, cnt in summary["borough_distribution"].items():
        print(f"   - {b.ljust(15)}: {cnt} complaints")
        
    print("\n=================================================================")
    print("                 EDA EVALUATION COMPLETED                        ")
    print("=================================================================")
    return summary


if __name__ == "__main__":
    run_eda_report()
