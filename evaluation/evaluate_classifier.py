"""
CivicSense Concept 1 Evaluation: Text Classification
Evaluates TF-IDF + Multiclass Logistic Regression model on Stratified 80/20 Test Split.
Computes Accuracy, Precision, Recall, F1-Score, Confusion Matrix, and tests unseen complaints.
"""

import os
import sys
import json
import random
from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.app.nlp.classifier import CivicClassifierModel, civic_classifier
from backend.app.nlp.preprocessing import preprocess_text

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_JSON_PATH = os.path.join(ROOT_DIR, "data", "processed", "civic_complaints_processed.json")


def stratified_split(records: List[Dict[str, Any]], test_ratio: float = 0.20, seed: int = 42) -> Tuple[List[Dict], List[Dict]]:
    """Performs stratified train/test split across all categories."""
    random.seed(seed)
    by_category = defaultdict(list)
    for r in records:
        by_category[r["category"]].append(r)
        
    train_records = []
    test_records = []
    
    for cat, items in by_category.items():
        shuffled = list(items)
        random.shuffle(shuffled)
        split_idx = int(len(shuffled) * (1.0 - test_ratio))
        train_records.extend(shuffled[:split_idx])
        test_records.extend(shuffled[split_idx:])
        
    random.shuffle(train_records)
    random.shuffle(test_records)
    return train_records, test_records


def calculate_metrics(y_true: List[str], y_pred: List[str], classes: List[str]) -> Dict[str, Any]:
    """Calculates precision, recall, f1, support, confusion matrix without external dependencies."""
    n_samples = len(y_true)
    class_to_idx = {c: i for i, c in enumerate(classes)}
    n_classes = len(classes)
    
    # Build Confusion Matrix
    cm = [[0 for _ in range(n_classes)] for _ in range(n_classes)]
    correct = 0
    for true, pred in zip(y_true, y_pred):
        if true in class_to_idx and pred in class_to_idx:
            t_idx = class_to_idx[true]
            p_idx = class_to_idx[pred]
            cm[t_idx][p_idx] += 1
            if t_idx == p_idx:
                correct += 1
                
    accuracy = correct / max(1, n_samples)
    
    # Per-class metrics
    per_class = {}
    macro_p, macro_r, macro_f1 = 0.0, 0.0, 0.0
    weighted_p, weighted_r, weighted_f1 = 0.0, 0.0, 0.0
    
    for i, cls_name in enumerate(classes):
        tp = cm[i][i]
        fp = sum(cm[r][i] for r in range(n_classes) if r != i)
        fn = sum(cm[i][c] for c in range(n_classes) if c != i)
        support = sum(cm[i])
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        per_class[cls_name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": support
        }
        
        macro_p += precision
        macro_r += recall
        macro_f1 += f1
        
        weight = support / max(1, n_samples)
        weighted_p += precision * weight
        weighted_r += recall * weight
        weighted_f1 += f1 * weight
        
    macro_p /= n_classes
    macro_r /= n_classes
    macro_f1 /= n_classes
    
    return {
        "accuracy": round(accuracy, 4),
        "macro_avg": {
            "precision": round(macro_p, 4),
            "recall": round(macro_r, 4),
            "f1_score": round(macro_f1, 4)
        },
        "weighted_avg": {
            "precision": round(weighted_p, 4),
            "recall": round(weighted_r, 4),
            "f1_score": round(weighted_f1, 4)
        },
        "per_class": per_class,
        "classes": classes,
        "confusion_matrix": cm
    }


def run_classification_evaluation():
    print("=================================================================")
    print("   CIVICSENSE CONCEPT 1: TEXT CLASSIFICATION EVALUATION          ")
    print("=================================================================")
    
    with open(PROCESSED_JSON_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)
        
    print(f"Loaded {len(records)} total civic complaint records.")
    
    # 1. Stratified Train / Test Split
    train_data, test_data = stratified_split(records, test_ratio=0.20, seed=42)
    print(f"Train split: {len(train_data)} records (80%) | Test split: {len(test_data)} records (20%)")
    
    X_train_texts = [r["original_text"] for r in train_data]
    y_train_labels = [r["category"] for r in train_data]
    
    X_test_texts = [r["original_text"] for r in test_data]
    y_test_labels = [r["category"] for r in test_data]
    
    # 2. Train Model
    print("\nTraining TF-IDF Vectorizer (1-2 ngrams) + Softmax Logistic Regression...")
    model = CivicClassifierModel(model_version="v1.0.0")
    model.train(X_train_texts, y_train_labels)
    
    # Save Model Artifacts
    model.save()
    
    # 3. Predict on Test Set
    X_test_preprocessed = [preprocess_text(t) for t in X_test_texts]
    X_test_matrix = model.vectorizer.transform(X_test_preprocessed)
    y_pred_labels = model.classifier.predict(X_test_matrix)
    
    # 4. Compute Metrics
    metrics = calculate_metrics(y_test_labels, y_pred_labels, model.classifier.classes_)
    
    print("\n" + "="*65)
    print("               CLASSIFICATION PERFORMANCE REPORT                 ")
    print("="*65)
    print(f"{'Category':<22} | {'Precision':<9} | {'Recall':<9} | {'F1-Score':<9} | {'Support':<7}")
    print("-"*65)
    for cat, m in metrics["per_class"].items():
        print(f"{cat:<22} | {m['precision']:<9.4f} | {m['recall']:<9.4f} | {m['f1_score']:<9.4f} | {m['support']:<7}")
    print("-"*65)
    print(f"{'Overall Accuracy':<22} | {metrics['accuracy']:<9.4f} | {'':<9} | {'':<9} | {len(test_data):<7}")
    print(f"{'Macro Average':<22} | {metrics['macro_avg']['precision']:<9.4f} | {metrics['macro_avg']['recall']:<9.4f} | {metrics['macro_avg']['f1_score']:<9.4f} | {len(test_data):<7}")
    print(f"{'Weighted Average':<22} | {metrics['weighted_avg']['precision']:<9.4f} | {metrics['weighted_avg']['recall']:<9.4f} | {metrics['weighted_avg']['f1_score']:<9.4f} | {len(test_data):<7}")
    print("="*65)
    
    print("\nCONFUSION MATRIX (Rows: True, Columns: Predicted):")
    header = "       " + " ".join([f"{c[:4]:>6}" for c in metrics["classes"]])
    print(header)
    for idx, row in enumerate(metrics["confusion_matrix"]):
        row_str = f"{metrics['classes'][idx][:6]:<6} " + " ".join([f"{val:>6}" for val in row])
        print(row_str)
        
    # 5. Test Unseen Live Citizen Complaints
    print("\n" + "="*65)
    print("   TESTING ON UNSEEN LIVE USER COMPLAINTS (Real-Time Inference)  ")
    print("="*65)
    unseen_samples = [
        "The garbage has not been collected from our street for five days.",
        "There is a huge pothole near the bus stand causing vehicle damage.",
        "The streetlight near our college has not been working for four nights.",
        "Open sewer manhole overflowing with black wastewater onto pedestrian road.",
        "No drinking water supply in our locality since yesterday morning.",
        "Traffic light signal stuck on red causing severe vehicular congestion.",
        "Broken branch hanging dangerously over electric cables in public park."
    ]
    
    for sample in unseen_samples:
        pred = model.predict_single(sample)
        print(f"\nComplaint  : \"{sample}\"")
        print(f"Prediction : Category -> {pred['predicted_category']} (Confidence: {pred['confidence']*100:.1f}%)")
        
    print("\n=================================================================")
    print("         CONCEPT 1 EVALUATION COMPLETED SUCCESSFULLY             ")
    print("=================================================================")
    return metrics


if __name__ == "__main__":
    run_classification_evaluation()
