"""
CivicSense Concept 2 Evaluation: Named Entity Recognition (NER)
Evaluates custom Civic NER against annotated ground-truth corpus.
Calculates Entity-level Precision, Recall, and F1-score across types:
LOCATION, INFRASTRUCTURE, DURATION, DEPARTMENT.
"""

import os
import sys
import json
from collections import defaultdict
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.app.nlp.ner import civic_ner

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NER_ANNOTATIONS_PATH = os.path.join(ROOT_DIR, "data", "evaluation", "ner_test_annotations.json")


def normalize_text(text: str) -> str:
    return " ".join(text.lower().strip().split())


def evaluate_ner():
    print("=================================================================")
    print("      CIVICSENSE CONCEPT 2: NAMED ENTITY RECOGNITION (NER)       ")
    print("=================================================================")
    
    with open(NER_ANNOTATIONS_PATH, "r", encoding="utf-8") as f:
        annotated_samples = json.load(f)
        
    print(f"Loaded {len(annotated_samples)} manually annotated civic test cases.")
    
    type_stats = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    
    total_tp = 0
    total_fp = 0
    total_fn = 0
    
    for sample in annotated_samples:
        text = sample["text"]
        cat = sample.get("category", "")
        expected = sample["expected_entities"]
        
        # Run custom NER
        predicted = civic_ner.extract_entities(text, predicted_category=cat)
        # Filter out DEPARTMENT from pure span metrics if not in expected annotations
        pred_spans = [p for p in predicted if p["entity_type"] != "DEPARTMENT"]
        
        # Match predicted against expected using span/overlap
        matched_expected = set()
        matched_predicted = set()
        
        for p_idx, p_ent in enumerate(pred_spans):
            p_type = p_ent["entity_type"]
            p_text = normalize_text(p_ent["entity_text"])
            
            match_found = False
            for e_idx, e_ent in enumerate(expected):
                if e_idx in matched_expected:
                    continue
                e_type = e_ent["entity_type"]
                e_text = normalize_text(e_ent["entity_text"])
                
                # Check type agreement and substring/overlap match
                if p_type == e_type and (p_text in e_text or e_text in p_text):
                    matched_expected.add(e_idx)
                    matched_predicted.add(p_idx)
                    type_stats[p_type]["tp"] += 1
                    total_tp += 1
                    match_found = True
                    break
                    
            if not match_found:
                type_stats[p_type]["fp"] += 1
                total_fp += 1
                
        for e_idx, e_ent in enumerate(expected):
            if e_idx not in matched_expected:
                e_type = e_ent["entity_type"]
                type_stats[e_type]["fn"] += 1
                total_fn += 1
                
    # Calculate Precision, Recall, F1
    print("\n" + "="*65)
    print("                 CIVIC NER PERFORMANCE REPORT                    ")
    print("="*65)
    print(f"{'Entity Type':<18} | {'Precision':<9} | {'Recall':<9} | {'F1-Score':<9} | {'TP/FP/FN':<10}")
    print("-"*65)
    
    for ent_type, stats in sorted(type_stats.items()):
        tp = stats["tp"]
        fp = stats["fp"]
        fn = stats["fn"]
        
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        
        counts_str = f"{tp}/{fp}/{fn}"
        print(f"{ent_type:<18} | {prec:<9.4f} | {rec:<9.4f} | {f1:<9.4f} | {counts_str:<10}")
        
    overall_prec = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    overall_rec = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    overall_f1 = (2 * overall_prec * overall_rec) / (overall_prec + overall_rec) if (overall_prec + overall_rec) > 0 else 0.0
    
    print("-"*65)
    print(f"{'OVERALL MICRO AVG':<18} | {overall_prec:<9.4f} | {overall_rec:<9.4f} | {overall_f1:<9.4f} | {total_tp}/{total_fp}/{total_fn}")
    print("="*65)
    
    return {
        "overall_precision": round(overall_prec, 4),
        "overall_recall": round(overall_rec, 4),
        "overall_f1": round(overall_f1, 4),
        "by_type": type_stats
    }


if __name__ == "__main__":
    evaluate_ner()
