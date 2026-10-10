"""
Complaints & Prediction Router
Handles live complaint submissions, real-time NLP analysis, and personal complaint history.
"""

import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends

from backend.app.schemas.schemas import (
    PredictRequest,
    PredictResponse,
    ComplaintCreateRequest,
    ComplaintResponse
)
from backend.app.database.connection import get_collection
from backend.app.database.models import (
    create_complaint_doc,
    create_entity_doc,
    create_model_prediction_doc
)
from backend.app.nlp.pipeline import nlp_pipeline
from backend.app.api.auth import get_current_user

router = APIRouter(tags=["Complaints & Prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict_complaint(req: PredictRequest):
    """
    Direct Real-Time NLP Pipeline Prediction Endpoint.
    Analyzes raw complaint text, identifies language, classifies issue, extracts entities.
    """
    result = nlp_pipeline.process_complaint(req.complaint, user_location=req.location or "")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return {
        "original_text": result["original_text"],
        "language": result["language"],
        "normalized_processing_text": result["normalized_processing_text"],
        "predicted_category": result["predicted_category"],
        "confidence": result["confidence"],
        "model_version": result["model_version"],
        "class_probabilities": result["class_probabilities"],
        "entities": result["entities"],
        "primary_location": result["primary_location"]
    }


@router.post("/complaints", response_model=ComplaintResponse)
def submit_complaint(
    req: ComplaintCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submits a live civic complaint:
    1. Executes full Integrated NLP pipeline (Language + Classification + NER)
    2. Generates Unique Complaint ID (CIV-XXXX)
    3. Saves structured record into database (complaints, entities, model_predictions)
    4. Returns structured AI response
    """
    result = nlp_pipeline.process_complaint(req.complaint_text, user_location=req.location or "")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    complaint_id = f"CIV-USR-{os.urandom(3).hex().upper()}"
    
    # 1. Create Complaint Document
    complaint_doc = create_complaint_doc(
        complaint_id=complaint_id,
        user_id=current_user.get("user_id", "ANONYMOUS"),
        original_text=result["original_text"],
        language=result["language"],
        source="User_Submitted",
        location=result["primary_location"],
        predicted_category=result["predicted_category"],
        confidence=result["confidence"],
        status="New",
        entities=result["entities"]
    )
    
    complaints_col = get_collection("complaints")
    complaints_col.insert_one(complaint_doc)
    
    # 2. Store Entities separately in entities collection
    entities_col = get_collection("entities")
    for ent in result["entities"]:
        entities_col.insert_one(create_entity_doc(
            complaint_id=complaint_id,
            entity_text=ent["entity_text"],
            entity_type=ent["entity_type"]
        ))
        
    # 3. Store Model Prediction in model_predictions collection
    preds_col = get_collection("model_predictions")
    preds_col.insert_one(create_model_prediction_doc(
        complaint_id=complaint_id,
        model_version=result["model_version"],
        predicted_category=result["predicted_category"],
        confidence=result["confidence"]
    ))

    # 4. Record Initial Timeline Event
    timeline_col = get_collection("issue_timeline")
    from backend.app.database.models import create_timeline_event_doc
    timeline_col.insert_one(create_timeline_event_doc(
        event_id=f"EVT-{os.urandom(4).hex().upper()}",
        complaint_id=complaint_id,
        event_type="SUBMISSION",
        title=f"Citizen Filed Complaint ({result['predicted_category']})",
        description=f"Complaint recorded and classified with {result['confidence']*100:.1f}% confidence.",
        actor_role=current_user.get("role", "CITIZEN").upper(),
        actor_name=current_user.get("name", "Citizen"),
        metadata={"category": result["predicted_category"], "location": result["primary_location"]}
    ))

    # 5. Core Differentiator: Related Complaints & Grouping
    from backend.app.nlp.related_issues import related_issue_engine
    try:
        related_issue_engine.link_complaint_to_group(
            new_complaint_id=complaint_id,
            candidate_text=result["original_text"],
            category=result["predicted_category"],
            location=result["primary_location"]
        )
    except Exception:
        pass

    # 6. Core Differentiator: Resolution Monitoring & Inconsistency Alert Check
    from backend.app.nlp.resolution_monitor import resolution_monitor_engine
    try:
        resolution_monitor_engine.check_for_inconsistency(
            new_complaint_id=complaint_id,
            new_text=result["original_text"],
            category=result["predicted_category"],
            location=result["primary_location"],
            evidence_assessment="PENDING_EVIDENCE"
        )
    except Exception:
        pass
    
    return complaint_doc


@router.get("/complaints/my", response_model=List[ComplaintResponse])
def get_my_complaints(current_user: dict = Depends(get_current_user)):
    """Fetches all complaints submitted by the authenticated user."""
    complaints_col = get_collection("complaints")
    items = complaints_col.find({"user_id": current_user["user_id"]})
    return items


@router.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_by_id(complaint_id: str, current_user: dict = Depends(get_current_user)):
    """Fetches specific complaint details by ID."""
    complaints_col = get_collection("complaints")
    item = complaints_col.find_one({"complaint_id": complaint_id})
    if not item:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    return item


@router.get("/complaints/{complaint_id}/full")
def get_complaint_full_details(complaint_id: str, current_user: dict = Depends(get_current_user)):
    """Fetches full complaint details including attached evidence and event timeline."""
    complaints_col = get_collection("complaints")
    evidence_col = get_collection("evidence")
    from backend.app.nlp.related_issues import related_issue_engine

    complaint = complaints_col.find_one({"complaint_id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    evidence = evidence_col.find({"complaint_id": complaint_id})
    timeline = related_issue_engine.build_complaint_timeline(complaint_id)

    return {
        "complaint": complaint,
        "evidence": evidence,
        "timeline": timeline
    }

