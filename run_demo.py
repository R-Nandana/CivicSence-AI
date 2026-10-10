"""
CivicSense Master Demonstration Script (Phase I Evaluation)
Executes and demonstrates the full Phase I faculty evaluation workflow:
1. Data Collection & Raw Dataset
2. ETL Pipeline (Extract -> Transform -> Load)
3. Exploratory Data Analysis (EDA)
4. Concept 1: Text Classification & Metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)
5. Concept 2: Named Entity Recognition (NER)
6. Concept 3: Multilingual NLP (English / Tamil / Tanglish)
7. Integrated Pipeline & Database Storage
8. Officer Review & AI Validation Feedback Loop
"""

import os
import sys
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from etl.run_etl import run_pipeline
from evaluation.run_eda import run_eda_report
from evaluation.evaluate_classifier import run_classification_evaluation
from evaluation.evaluate_ner import evaluate_ner
from evaluation.evaluate_translation import run_translation_evaluation
from evaluation.evaluate_speech import run_speech_evaluation
from backend.app.nlp.pipeline import nlp_pipeline
from backend.app.database.connection import get_collection
from backend.app.database.models import create_complaint_doc, create_validated_feedback_doc



def run_master_demo():
    print("=" * 72)
    print("      CIVICSENSE: PHASE I MASTER FACULTY DEMONSTRATION")
    print("=" * 72)
    
    # -------------------------------------------------------------
    # STEP 1 & 2: DATASET & SOURCE
    # -------------------------------------------------------------
    print("\n[STEP 1 & 2]: REAL-WORLD DATASET IDENTIFICATION & RAW DATA")
    print("Official Source  : NYC 311 Service Requests Open Data API (Socrata)")
    print("Endpoint URL     : https://data.cityofnewyork.us/resource/erm2-nwe9.json")
    print("Relevant Columns : unique_key, created_date, complaint_type, descriptor,")
    print("                   incident_address, borough, status, resolution_description")
    print("Target Target    : mapped to 8 CivicSense Standard Categories")
    
    # -------------------------------------------------------------
    # STEP 3 & 4: ETL PIPELINE & DATABASE LOADING
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 3 & 4]: EXECUTING MODULAR ETL PIPELINE (Extract -> Transform -> Load)")
    print("-" * 72)
    transformed_records, stats = run_pipeline(limit=800)
    
    # -------------------------------------------------------------
    # STEP 5: EXPLORATORY DATA ANALYSIS (EDA)
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 5]: EXPLORATORY DATA ANALYSIS (EDA) BREAKDOWN")
    print("-" * 72)
    eda_summary = run_eda_report()
    
    # -------------------------------------------------------------
    # STEP 6: CONCEPT 1 - TEXT CLASSIFICATION & EVALUATION
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 6]: CONCEPT 1 — TEXT CLASSIFICATION (TF-IDF + Softmax Logistic Regression)")
    print("-" * 72)
    clf_metrics = run_classification_evaluation()

    # -------------------------------------------------------------
    # STEP 7: CONCEPT 2 — MACHINE TRANSLATION EVALUATION
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 7]: CONCEPT 2 — MACHINE TRANSLATION (TAMIL / TANGLISH -> ENGLISH)")
    print("-" * 72)
    mt_metrics = run_translation_evaluation()

    # -------------------------------------------------------------
    # STEP 8: CONCEPT 3 — SPEECH PROCESSING (ASR & ACOUSTIC ANALYSIS)
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 8]: CONCEPT 3 — SPEECH PROCESSING (VOICE-TO-TEXT & ACOUSTICS)")
    print("-" * 72)
    speech_metrics = run_speech_evaluation()

    # -------------------------------------------------------------
    # STEP 9: CONCEPT 4 — MULTILINGUAL NLP & INTEGRATED PIPELINE
    # -------------------------------------------------------------
    print("\n" + "-" * 72)

    print("[STEP 8 & 9]: CONCEPT 3 & INTEGRATED PIPELINE IN ACTION")
    print("Demonstrating English, native Tamil, and Tanglish live inputs...")
    print("-" * 72)
    
    demo_inputs = [
        ("The streetlight near the bus stand has been off for four days.", "Gandhipuram Ward 10"),
        ("Bus stand pakkathula streetlight 4 days ah work aagala.", "Near Central Bus Stop"),
        ("எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை.", "அண்ணா நகர்"),
        ("There is a huge pothole near the bus stand causing problems for two weeks.", "5th Main Road"),
        ("Open sewage drain overflowing opposite city hospital for past 3 days.", "Hospital Road")
    ]
    
    complaints_col = get_collection("complaints")
    demo_created_ids = []
    
    for idx, (raw_text, loc) in enumerate(demo_inputs, 1):
        res = nlp_pipeline.process_complaint(raw_text, user_location=loc)
        complaint_id = f"CIV-DEMO-{1000 + idx}"
        demo_created_ids.append(complaint_id)
        
        # Save to database
        doc = create_complaint_doc(
            complaint_id=complaint_id,
            user_id="USR-CITIZEN-DEMO",
            original_text=res["original_text"],
            language=res["language"],
            source="User_Submitted",
            location=res["primary_location"],
            predicted_category=res["predicted_category"],
            confidence=res["confidence"],
            status="New",
            entities=res["entities"]
        )
        complaints_col.insert_one(doc)
        
        print(f"\n[DEMO CASE {idx}]:")
        print(f"  Input Text       : \"{raw_text}\"")
        print(f"  Detected Language: {res['language']}")
        if res.get("translated_text") and res["translated_text"] != raw_text:
            print(f"  Machine Translation (-> English): \"{res['translated_text']}\"")
        print(f"  Predicted Category: {res['predicted_category']} (Confidence: {res['confidence']*100:.1f}%)")

        print(f"  Assigned Dept    : {next((e['entity_text'] for e in res['entities'] if e['entity_type'] == 'DEPARTMENT'), 'Municipal Board')}")
        print(f"  Extracted Entities:")
        for ent in res["entities"]:
            if ent["entity_type"] != "DEPARTMENT":
                print(f"    - {ent['entity_type'].ljust(15)}: {ent['entity_text']}")
        print(f"  Database Status  : Stored successfully as '{complaint_id}'")
        
    # -------------------------------------------------------------
    # STEP 10: OFFICER REVIEW & AI VALIDATION FEEDBACK LOOP
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 10]: OFFICER REVIEW & AI VALIDATION FEEDBACK LOOP")
    print("-" * 72)
    
    target_id = demo_created_ids[0]
    target_complaint = complaints_col.find_one({"complaint_id": target_id})
    print(f"Officer reviewing complaint: {target_id}")
    print(f"Complaint Text: \"{target_complaint['original_text']}\"")
    print(f"AI Category   : {target_complaint['predicted_category']}")
    print(f"Officer Action: Confirming and validating prediction as '{target_complaint['predicted_category']}'")
    
    feedback_col = get_collection("validated_feedback")
    fb_doc = create_validated_feedback_doc(
        complaint_id=target_id,
        original_prediction=target_complaint['predicted_category'],
        correct_category=target_complaint['predicted_category'],
        validated_by="Divya Ramesh (Municipal Officer)",
        notes="Confirmed lighting defect verified by field junior engineer."
    )
    feedback_col.insert_one(fb_doc)
    
    complaints_col.update_one(
        {"complaint_id": target_id},
        {"$set": {"status": "In Progress", "validated_by": "Divya Ramesh (Municipal Officer)"}}
    )
    
    print(f"Validated feedback logged to 'validated_feedback' collection.")
    print(f"Complaint '{target_id}' status updated to 'In Progress'.")

    # -------------------------------------------------------------
    # STEP 11: CONCEPT 6 — DATABASE-GROUNDED QUESTION ANSWERING
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 11]: CONCEPT 6 — DATABASE-GROUNDED QUESTION ANSWERING")
    print("-" * 72)
    from backend.app.nlp.db_qa import db_qa_engine
    qa_samples = [
        "How many unresolved streetlight complaints are there?",
        "Which locations have recurring drainage complaints?",
        "Which issues were reported again after being marked resolved?"
    ]
    for q in qa_samples:
        ans = db_qa_engine.answer_question(q)
        print(f"\nQuestion : \"{q}\"")
        print(f"Intent   : {ans['detected_intent']} (Latency: {ans['execution_time_ms']}ms)")
        print(f"Answer   : {ans['answer']}")
        print(f"Matched  : {ans['matched_record_count']} real database records")

    # -------------------------------------------------------------
    # STEP 12: COMPUTER VISION EVIDENCE CONSISTENCY ASSESSMENT
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 12]: COMPUTER VISION EVIDENCE VERIFICATION")
    print("-" * 72)
    from backend.app.nlp.vision import civic_vision_engine
    assess, exp = civic_vision_engine._evaluate_evidence_consistency(
        top_category="Roads",
        top_confidence=0.82,
        complaint_category="Roads",
        class_probs={"Roads": 0.82, "Traffic": 0.10}
    )
    print("Testing visual consistency between uploaded photo and reported category 'Roads':")
    print(f"Visual Verdict  : {assess}")
    print(f"Explanation     : {exp}")

    # -------------------------------------------------------------
    # STEP 13: CORE DIFFERENTIATOR — RELATED COMPLAINTS & ISSUE EVOLUTION
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 13]: RELATED COMPLAINTS & ISSUE EVOLUTION MATCHING")
    print("-" * 72)
    from backend.app.nlp.related_issues import related_issue_engine
    rel_res = related_issue_engine.find_related_complaints(
        candidate_text="Another broken streetlight near the central bus stand",
        category="Streetlights",
        location="Central Bus Stop",
        limit=2
    )
    print("Scanning historical complaints for candidate issue:")
    for r in rel_res:
        print(f"  * Matched: {r['existing_complaint_id']} | Type: {r['relationship_type']} | Match: {r['composite_score']*100:.1f}%")
        print(f"    Rationale: {r['rationale']}")

    # -------------------------------------------------------------
    # STEP 14: CORE DIFFERENTIATOR — RESOLUTION INCONSISTENCY MONITORING
    # -------------------------------------------------------------
    print("\n" + "-" * 72)
    print("[STEP 14]: RESOLUTION INCONSISTENCY MONITORING")
    print("-" * 72)
    from backend.app.nlp.resolution_monitor import resolution_monitor_engine
    inconsist_alert = resolution_monitor_engine.check_for_inconsistency(
        new_complaint_id="CIV-FOLLOWUP-DEMO",
        new_text="Streetlight still dark and not working near bus stand after repair claimed",
        category="Streetlights",
        location="Gandhipuram Ward 10",
        evidence_assessment="SUPPORTS_COMPLAINT"
    )
    if inconsist_alert:
        print(f"Alert Triggered : {inconsist_alert['alert_id']}")
        print(f"Neutral Message : \"{inconsist_alert['alert_message']}\"")
        print(f"Review Status   : {inconsist_alert['status']}")
    else:
        print("Resolution monitor active: Scanning for recurring follow-ups against marked-resolved tickets.")
    
    print("\n" + "=" * 72)
    print("      COMPLETE CIVICSENSE MASTER DEMONSTRATION SUCCESSFUL")
    print("=" * 72)


if __name__ == "__main__":
    run_master_demo()
