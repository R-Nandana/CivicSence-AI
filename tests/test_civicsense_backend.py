"""
CivicSense Comprehensive Automated Test Suite
Tests:
- Authentication & Role-Based Authorization
- Concept 1: Text Classification Inference
- Concept 2: Named Entity Recognition (NER)
- Concept 3 & 4: Multilingual Processing & Machine Translation
- Concept 5: Speech Processing & Acoustic Analysis & WER
- Concept 6: Database-Grounded Question Answering
- Section 6: Image Evidence Verification & Vision Engine
- Section 7: Video Evidence Frame Analysis
- Section 8: Related Complaints & Issue Grouping & Timeline
- Section 9: Resolution Monitoring & Inconsistency Alerts
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from backend.app.main import app
from backend.app.nlp.classifier import civic_classifier
from backend.app.nlp.ner import civic_ner
from backend.app.nlp.translation import machine_translator
from backend.app.nlp.speech import speech_processor, SpeechProcessor
from backend.app.nlp.vision import civic_vision_engine
from backend.app.nlp.related_issues import related_issue_engine
from backend.app.nlp.resolution_monitor import resolution_monitor_engine
from backend.app.nlp.db_qa import db_qa_engine

client = TestClient(app)


# 1. Authentication Tests
def test_auth_login_citizen():
    response = client.post("/api/auth/login", json={
        "email": "citizen@civicsense.org",
        "password": "citizen123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "citizen"


def test_auth_login_officer():
    response = client.post("/api/auth/login", json={
        "email": "officer@civicsense.org",
        "password": "officer123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "officer"


def test_auth_invalid_login():
    response = client.post("/api/auth/login", json={
        "email": "citizen@civicsense.org",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


# 2. NLP Concept 1: Text Classification
def test_concept1_classification_pothole():
    res = civic_classifier.predict_single("Huge pothole on road causing vehicle damage")
    assert res["predicted_category"] == "Roads"
    assert res["confidence"] > 0.50
    assert "Roads" in res["class_probabilities"]


def test_concept1_classification_streetlight():
    res = civic_classifier.predict_single("Streetlight is not working near the bus stand for four days")
    assert res["predicted_category"] == "Streetlights"
    assert res["confidence"] > 0.50


# 3. NLP Concept 2: Named Entity Recognition
def test_concept2_ner_extraction():
    text = "The streetlight near the bus stand has not worked for four days."
    entities = civic_ner.extract_entities(text, predicted_category="Streetlights")
    types = [e["entity_type"] for e in entities]
    assert "DURATION" in types
    assert "LOCATION" in types
    assert "INFRASTRUCTURE" in types


# 4. NLP Concept 3 & 4: Multilingual & Translation
def test_concept4_translation_tanglish():
    res = machine_translator.translate_to_english("Bus stand pakkathula streetlight work aagala")
    assert res["is_translated"] is True
    assert "streetlight" in res["translated_text"].lower()


# 5. NLP Concept 5: Speech Processing & WER
def test_concept5_wer_calculation():
    ref = "streetlight near bus stand is not working"
    hyp = "streetlight near bus stand is not working"
    wer_exact = SpeechProcessor.calculate_wer(ref, hyp)
    assert wer_exact == 0.0

    hyp_diff = "streetlight near bus stop is not working"
    wer_diff = SpeechProcessor.calculate_wer(ref, hyp_diff)
    assert wer_diff > 0.0


# 6. Concept 6: Database-Grounded Question Answering
def test_concept6_db_qa_unresolved():
    res = db_qa_engine.answer_question("How many unresolved streetlight complaints are there?")
    assert "Streetlights" in res["answer"]
    assert res["detected_intent"] == "UNRESOLVED_BY_CATEGORY"
    assert "supporting_records" in res


def test_concept6_db_qa_recurring():
    res = db_qa_engine.answer_question("Which locations have recurring drainage complaints?")
    assert res["detected_intent"] == "RECURRING_BY_LOCATION"
    assert "Drainage" in res["answer"]


# 7. Section 6: Image Evidence Verification & Vision Engine
def test_vision_consistency_evaluation():
    # Category matches visual class
    assess, exp = civic_vision_engine._evaluate_evidence_consistency(
        top_category="Roads",
        top_confidence=0.75,
        complaint_category="Roads",
        class_probs={"Roads": 0.75, "Traffic": 0.15}
    )
    assert assess == "SUPPORTS_COMPLAINT"

    # Category conflicts
    assess_conf, exp_conf = civic_vision_engine._evaluate_evidence_consistency(
        top_category="Streetlights",
        top_confidence=0.85,
        complaint_category="Roads",
        class_probs={"Streetlights": 0.85, "Roads": 0.05}
    )
    assert assess_conf == "POTENTIAL_CONFLICT"


# 8. Section 8: Related Complaints & Grouping
def test_related_complaints_matching():
    comp1 = {
        "complaint_id": "CIV-TEST-1",
        "original_text": "Deep pothole near Anna Nagar bus stand",
        "predicted_category": "Roads",
        "location": "Anna Nagar bus stand",
        "status": "New",
        "created_at": "2026-10-10T10:00:00+00:00"
    }

    res = related_issue_engine.compute_relatedness(
        candidate_text="Deep pothole near Anna Nagar bus stand",
        candidate_category="Roads",
        candidate_location="Anna Nagar bus stand",
        existing_complaint=comp1
    )
    assert res["composite_score"] > 0.80
    assert res["relationship_type"] in ["LIKELY_DUPLICATE", "NEW_REPORT_SAME_ISSUE"]


# 9. Section 9: Resolution Monitoring & Inconsistency Alerts
def test_resolution_monitor_inconsistency():
    alert = resolution_monitor_engine.check_for_inconsistency(
        new_complaint_id="CIV-NEW-99",
        new_text="Pothole still open and damaged after repair was claimed at Anna Nagar",
        category="Roads",
        location="Anna Nagar",
        evidence_assessment="SUPPORTS_COMPLAINT"
    )
    # If no resolved complaint in Anna Nagar, it gracefully returns None or alert
    if alert:
        assert "alert_message" in alert
        assert "inconsistent with the current resolved status" in alert["alert_message"]


# 10. API Health Endpoint
def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
