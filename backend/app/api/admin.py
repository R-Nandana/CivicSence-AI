"""
Officer & Admin Router
Allows municipal officers to review complaints, update status, validate AI predictions,
inspect extracted entities, and view governance analytics.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from collections import Counter

from backend.app.schemas.schemas import (
    ComplaintResponse,
    StatusUpdateRequest,
    ValidationFeedbackRequest
)
from backend.app.database.connection import get_collection
from backend.app.database.models import create_validated_feedback_doc
from backend.app.api.auth import require_officer

router = APIRouter(prefix="/admin", tags=["Officer / Admin Operations"])


@router.get("/complaints", response_model=List[ComplaintResponse])
def get_all_complaints(
    category: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 200,
    officer: dict = Depends(require_officer)
):
    """Fetches complaints with dynamic filtering by category, source, status, or search keywords."""
    complaints_col = get_collection("complaints")
    query = {}
    
    if category:
        query["predicted_category"] = category
    if source:
        query["source"] = source
    if status:
        query["status"] = status
        
    records = complaints_col.find(query)
    
    if search:
        s_lower = search.lower()
        records = [
            r for r in records
            if s_lower in r.get("original_text", "").lower()
            or s_lower in r.get("location", "").lower()
            or s_lower in r.get("complaint_id", "").lower()
        ]
        
    return records[:limit]


@router.put("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    req: StatusUpdateRequest,
    officer: dict = Depends(require_officer)
):
    """Updates complaint resolution status."""
    complaints_col = get_collection("complaints")
    res = complaints_col.update_one(
        {"complaint_id": complaint_id},
        {"$set": {"status": req.status}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    return {"message": f"Status updated to '{req.status}' successfully.", "complaint_id": complaint_id}


@router.post("/admin/validate", tags=["Officer / Admin Operations"])
@router.post("/validate")
def validate_ai_prediction(
    req: ValidationFeedbackRequest,
    officer: dict = Depends(require_officer)
):
    """
    Officer Validation & Feedback Loop:
    1. Validates or corrects AI predicted category
    2. Stores feedback in validated_feedback collection for future model retraining
    3. Updates complaint record with validated category
    """
    complaints_col = get_collection("complaints")
    feedback_col = get_collection("validated_feedback")
    
    complaint = complaints_col.find_one({"complaint_id": req.complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")
        
    # 1. Store feedback document
    fb_doc = create_validated_feedback_doc(
        complaint_id=req.complaint_id,
        original_prediction=req.original_prediction,
        correct_category=req.correct_category,
        validated_by=officer.get("name", officer.get("email")),
        notes=req.notes
    )
    feedback_col.insert_one(fb_doc)
    
    # 2. Update complaint with verified category
    complaints_col.update_one(
        {"complaint_id": req.complaint_id},
        {"$set": {
            "predicted_category": req.correct_category,
            "status": "In Progress" if complaint.get("status") == "New" else complaint.get("status"),
            "validated_by": officer.get("name", officer.get("email"))
        }}
    )
    
    return {
        "message": "AI prediction validated and recorded for future training candidates.",
        "complaint_id": req.complaint_id,
        "correct_category": req.correct_category
    }


@router.get("/validated-feedback")
def get_validated_feedback(officer: dict = Depends(require_officer)):
    """Returns all validated feedback logs."""
    feedback_col = get_collection("validated_feedback")
    return feedback_col.find()


@router.get("/stats")
def get_admin_dashboard_stats(officer: dict = Depends(require_officer)):
    """Computes high-level officer KPI metrics."""
    complaints_col = get_collection("complaints")
    feedback_col = get_collection("validated_feedback")
    
    all_complaints = complaints_col.find()
    total = len(all_complaints)
    user_submitted = sum(1 for c in all_complaints if c.get("source") == "User_Submitted")
    dataset_records = total - user_submitted
    
    categories = Counter(c.get("predicted_category", "Unknown") for c in all_complaints)
    statuses = Counter(c.get("status", "New") for c in all_complaints)
    languages = Counter(c.get("language", "English") for c in all_complaints)
    
    validated_count = feedback_col.count_documents()
    
    return {
        "total_complaints": total,
        "user_submitted_count": user_submitted,
        "dataset_count": dataset_records,
        "validated_feedback_count": validated_count,
        "category_distribution": dict(categories.most_common()),
        "status_distribution": dict(statuses.most_common()),
        "language_distribution": dict(languages.most_common())
    }
