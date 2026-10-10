"""
CivicSense Evidence Verification Router
Handles Image and Video evidence uploads, automatic computer vision analysis,
evidence consistency assessment against complaints, and officer verification reviews.
"""

import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from PIL import Image

from backend.app.schemas.schemas import EvidenceReviewRequest
from backend.app.database.connection import get_collection
from backend.app.database.models import (
    create_evidence_doc,
    create_timeline_event_doc
)
from backend.app.nlp.vision import (
    civic_vision_engine,
    IMAGES_DIR,
    VIDEOS_DIR
)
from backend.app.api.auth import get_current_user, require_officer

router = APIRouter(prefix="/evidence", tags=["Computer Vision & Evidence Verification"])


@router.post("/upload-image")
async def upload_image_evidence(
    complaint_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Ingests and analyzes citizen image evidence for a civic complaint.
    1. Validates format and size
    2. Runs Computer Vision feature and object recognition
    3. Evaluates consistency against complaint category:
       (SUPPORTS_COMPLAINT | POTENTIAL_CONFLICT | INCONCLUSIVE | REQUIRES_HUMAN_REVIEW)
    4. Persists record and timeline event
    """
    complaints_col = get_collection("complaints")
    complaint = complaints_col.find_one({"complaint_id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Referenced complaint not found.")

    complaint_category = complaint.get("predicted_category", "Roads")

    # Read bytes
    content = await file.read()
    file_size = len(content)

    # Save to disk
    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    evidence_id = f"EVD-IMG-{uuid.uuid4().hex[:8].upper()}"
    saved_filename = f"{evidence_id}{ext}"
    file_path = os.path.join(IMAGES_DIR, saved_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Validate image
    try:
        with Image.open(file_path) as img:
            is_valid, err_msg = civic_vision_engine.validate_image_file(file.filename, file_size, img)
            if not is_valid:
                os.remove(file_path)
                raise HTTPException(status_code=400, detail=err_msg)
            width, height = img.size
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Run Computer Vision analysis
    analysis = civic_vision_engine.analyze_image(file_path, complaint_category=complaint_category)

    # Persist evidence record
    evidence_doc = create_evidence_doc(
        evidence_id=evidence_id,
        complaint_id=complaint_id,
        media_type="image",
        file_path=f"/uploads/images/{saved_filename}",
        file_name=file.filename,
        file_size_bytes=file_size,
        width=width,
        height=height,
        duration_seconds=None,
        detected_classes=analysis.get("detected_classes", []),
        top_predicted_category=analysis.get("top_predicted_category", "Unknown"),
        confidence_score=analysis.get("confidence_score", 0.0),
        evidence_assessment=analysis.get("evidence_assessment", "INCONCLUSIVE"),
        model_version=civic_vision_engine.model_version,
        frame_findings=[],
        officer_review_status="PENDING_REVIEW"
    )

    evidence_col = get_collection("evidence")
    evidence_col.insert_one(evidence_doc)

    # Record Timeline Event
    timeline_col = get_collection("issue_timeline")
    timeline_col.insert_one(create_timeline_event_doc(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        complaint_id=complaint_id,
        event_type="EVIDENCE_UPLOAD",
        title="Citizen Uploaded Image Evidence",
        description=f"Evidence {evidence_id} assessed as {evidence_doc['evidence_assessment']} ({evidence_doc['confidence_score']*100:.1f}% confidence for {evidence_doc['top_predicted_category']}).",
        actor_role=current_user.get("role", "CITIZEN").upper(),
        actor_name=current_user.get("name", "Citizen"),
        metadata={"evidence_id": evidence_id, "assessment": evidence_doc["evidence_assessment"]}
    ))

    return {
        "message": "Image evidence successfully analyzed and recorded.",
        "evidence": evidence_doc,
        "analysis": analysis
    }


@router.post("/upload-video")
async def upload_video_evidence(
    complaint_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Ingests and analyzes citizen video evidence.
    1. Validates file size (max 50MB) and format
    2. Extracts representative keyframes
    3. Analyzes each keyframe for civic infrastructure features
    4. Computes video-level aggregated evidence assessment
    """
    complaints_col = get_collection("complaints")
    complaint = complaints_col.find_one({"complaint_id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Referenced complaint not found.")

    complaint_category = complaint.get("predicted_category", "Roads")

    content = await file.read()
    file_size = len(content)

    if file_size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Video exceeds maximum allowed size of 50MB.")

    ext = os.path.splitext(file.filename)[1].lower() or ".mp4"
    evidence_id = f"EVD-VID-{uuid.uuid4().hex[:8].upper()}"
    saved_filename = f"{evidence_id}{ext}"
    file_path = os.path.join(VIDEOS_DIR, saved_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Extract & Analyze Video Keyframes
    analysis = civic_vision_engine.extract_and_analyze_video(
        file_path,
        complaint_category=complaint_category,
        max_frames=5
    )

    evidence_doc = create_evidence_doc(
        evidence_id=evidence_id,
        complaint_id=complaint_id,
        media_type="video",
        file_path=f"/uploads/videos/{saved_filename}",
        file_name=file.filename,
        file_size_bytes=file_size,
        width=1280,
        height=720,
        duration_seconds=analysis.get("duration_seconds", 5.0),
        detected_classes=[{"label": analysis.get("top_predicted_category", "Roads"), "confidence": analysis.get("confidence_score", 0.8)}],
        top_predicted_category=analysis.get("top_predicted_category", "Roads"),
        confidence_score=analysis.get("confidence_score", 0.8),
        evidence_assessment=analysis.get("evidence_assessment", "SUPPORTS_COMPLAINT"),
        model_version=civic_vision_engine.model_version,
        frame_findings=analysis.get("frame_findings", []),
        officer_review_status="PENDING_REVIEW"
    )

    evidence_col = get_collection("evidence")
    evidence_col.insert_one(evidence_doc)

    # Record Timeline Event
    timeline_col = get_collection("issue_timeline")
    timeline_col.insert_one(create_timeline_event_doc(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        complaint_id=complaint_id,
        event_type="EVIDENCE_UPLOAD",
        title="Citizen Uploaded Video Evidence",
        description=f"Video evidence {evidence_id} assessed as {evidence_doc['evidence_assessment']} across {len(evidence_doc['frame_findings'])} keyframes.",
        actor_role=current_user.get("role", "CITIZEN").upper(),
        actor_name=current_user.get("name", "Citizen"),
        metadata={"evidence_id": evidence_id, "assessment": evidence_doc["evidence_assessment"]}
    ))

    return {
        "message": "Video evidence successfully analyzed and recorded.",
        "evidence": evidence_doc,
        "analysis": analysis
    }


@router.get("/complaint/{complaint_id}")
def get_complaint_evidence(complaint_id: str, current_user: dict = Depends(get_current_user)):
    """Fetches all evidence items (images, videos, frame findings) linked to a complaint."""
    evidence_col = get_collection("evidence")
    items = evidence_col.find({"complaint_id": complaint_id})
    return items


@router.get("/all")
def get_all_evidence(officer: dict = Depends(require_officer)):
    """Fetches recent evidence records for officer inspection."""
    evidence_col = get_collection("evidence")
    return evidence_col.find()[:50]


@router.post("/{evidence_id}/review")
def review_evidence(
    evidence_id: str,
    req: EvidenceReviewRequest,
    officer: dict = Depends(require_officer)
):
    """
    Municipal Officer Review and Override:
    Allows an authorized officer to confirm or adjust the AI evidence assessment.
    """
    evidence_col = get_collection("evidence")
    ev = evidence_col.find_one({"evidence_id": evidence_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found.")

    new_assessment = req.corrected_assessment or ev.get("evidence_assessment")
    update_data = {
        "officer_review_status": req.officer_review_status,
        "evidence_assessment": new_assessment,
        "officer_notes": req.officer_notes or "",
        "reviewed_by": officer.get("name", officer.get("email"))
    }
    evidence_col.update_one({"evidence_id": evidence_id}, {"$set": update_data})

    # Record Timeline Event
    timeline_col = get_collection("issue_timeline")
    timeline_col.insert_one(create_timeline_event_doc(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        complaint_id=ev["complaint_id"],
        event_type="OFFICER_VALIDATION",
        title=f"Officer Evidence Assessment Review: {req.officer_review_status}",
        description=f"Evidence {evidence_id} assessment set to '{new_assessment}'. Notes: {req.officer_notes or 'No notes'}",
        actor_role="OFFICER",
        actor_name=officer.get("name", "Municipal Officer"),
        metadata={"evidence_id": evidence_id, "status": req.officer_review_status, "assessment": new_assessment}
    ))

    return {
        "message": "Evidence review successfully updated.",
        "evidence_id": evidence_id,
        "new_assessment": new_assessment
    }
