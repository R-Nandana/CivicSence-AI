"""
CivicSense Database Models & Schema Definitions
Defines structure and helpers for collections:
- users
- complaints
- entities
- model_predictions
- validated_feedback
- etl_logs
"""

import datetime
from typing import Dict, Any, List, Optional


def create_user_doc(
    user_id: str,
    name: str,
    email: str,
    password_hash: str,
    role: str = "citizen"
) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "name": name,
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "role": role,  # 'citizen' or 'officer'
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def create_complaint_doc(
    complaint_id: str,
    user_id: str,
    original_text: str,
    language: str,
    source: str,
    location: Optional[str],
    predicted_category: str,
    confidence: float,
    status: str = "New",
    entities: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "complaint_id": complaint_id,
        "user_id": user_id,
        "original_text": original_text,
        "language": language,
        "source": source,  # 'NYC_311_Dataset' or 'User_Submitted'
        "location": location or "Not Specified",
        "predicted_category": predicted_category,
        "confidence": round(float(confidence), 4),
        "status": status,  # 'New', 'In Review', 'In Progress', 'Resolved', 'Rejected'
        "entities": entities or [],
        "created_at": now,
        "updated_at": now
    }


def create_entity_doc(
    complaint_id: str,
    entity_text: str,
    entity_type: str
) -> Dict[str, Any]:
    return {
        "complaint_id": complaint_id,
        "entity_text": entity_text,
        "entity_type": entity_type,  # 'LOCATION', 'INFRASTRUCTURE', 'DURATION', 'DEPARTMENT'
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def create_model_prediction_doc(
    complaint_id: str,
    model_version: str,
    predicted_category: str,
    confidence: float
) -> Dict[str, Any]:
    return {
        "complaint_id": complaint_id,
        "model_version": model_version,
        "predicted_category": predicted_category,
        "confidence": round(float(confidence), 4),
        "prediction_time": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def create_validated_feedback_doc(
    complaint_id: str,
    original_prediction: str,
    correct_category: str,
    validated_by: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    return {
        "complaint_id": complaint_id,
        "original_prediction": original_prediction,
        "correct_category": correct_category,
        "validated_by": validated_by,
        "validation_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "notes": notes or ""
    }


def create_etl_log_doc(
    source: str,
    records_extracted: int,
    records_transformed: int,
    records_loaded: int,
    status: str = "SUCCESS",
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    return {
        "source": source,
        "records_extracted": records_extracted,
        "records_transformed": records_transformed,
        "records_loaded": records_loaded,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": status,
        "details": details or {}
    }


def create_evidence_doc(
    evidence_id: str,
    complaint_id: str,
    media_type: str,  # 'image' or 'video'
    file_path: str,
    file_name: str,
    file_size_bytes: int,
    width: Optional[int],
    height: Optional[int],
    duration_seconds: Optional[float],
    detected_classes: List[Dict[str, Any]],
    top_predicted_category: str,
    confidence_score: float,
    evidence_assessment: str,  # 'SUPPORTS_COMPLAINT' | 'POTENTIAL_CONFLICT' | 'INCONCLUSIVE' | 'REQUIRES_HUMAN_REVIEW'
    model_version: str = "CivicVision-v1.0",
    frame_findings: Optional[List[Dict[str, Any]]] = None,
    officer_review_status: str = "PENDING_REVIEW",  # 'PENDING_REVIEW' | 'CONFIRMED' | 'OVERRIDDEN'
    officer_notes: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "evidence_id": evidence_id,
        "complaint_id": complaint_id,
        "media_type": media_type,
        "file_path": file_path,
        "file_name": file_name,
        "file_size_bytes": file_size_bytes,
        "width": width,
        "height": height,
        "duration_seconds": duration_seconds,
        "detected_classes": detected_classes,
        "top_predicted_category": top_predicted_category,
        "confidence_score": round(float(confidence_score), 4),
        "evidence_assessment": evidence_assessment,
        "model_version": model_version,
        "frame_findings": frame_findings or [],
        "officer_review_status": officer_review_status,
        "officer_notes": officer_notes or "",
        "created_at": now,
        "updated_at": now
    }


def create_issue_group_doc(
    group_id: str,
    title: str,
    category: str,
    location: str,
    primary_complaint_id: str,
    complaint_ids: List[str],
    relation_type: str = "NEW_REPORT_SAME_ISSUE",  # 'LIKELY_DUPLICATE', 'NEW_REPORT_SAME_ISSUE', 'FOLLOW_UP_PERSISTING', 'NEW_ISSUE_SAME_LOCATION'
    status: str = "ACTIVE",
    similarity_score: float = 0.85
) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "group_id": group_id,
        "title": title,
        "category": category,
        "location": location,
        "primary_complaint_id": primary_complaint_id,
        "complaint_ids": complaint_ids,
        "relation_type": relation_type,
        "status": status,
        "similarity_score": round(float(similarity_score), 4),
        "created_at": now,
        "updated_at": now
    }


def create_timeline_event_doc(
    event_id: str,
    complaint_id: str,
    event_type: str,  # 'SUBMISSION' | 'STATUS_CHANGE' | 'AI_CLASSIFICATION' | 'EVIDENCE_UPLOAD' | 'OFFICER_VALIDATION' | 'RESOLUTION_CLAIM' | 'FOLLOW_UP_REPORT' | 'INCONSISTENCY_FLAG'
    title: str,
    description: str,
    actor_role: str,  # 'CITIZEN' | 'OFFICER' | 'SYSTEM_AI'
    actor_name: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    return {
        "event_id": event_id,
        "complaint_id": complaint_id,
        "event_type": event_type,
        "title": title,
        "description": description,
        "actor_role": actor_role,
        "actor_name": actor_name,
        "metadata": metadata or {},
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def create_resolution_alert_doc(
    alert_id: str,
    original_complaint_id: str,
    followup_complaint_id: str,
    category: str,
    location: str,
    alert_message: str,
    evidence_assessment: Optional[str] = None,
    status: str = "PENDING_VERIFICATION",  # 'PENDING_VERIFICATION' | 'CONFIRMED_UNRESOLVED' | 'DISMISSED_RESOLVED'
    review_notes: Optional[str] = None,
    reviewed_by: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "alert_id": alert_id,
        "original_complaint_id": original_complaint_id,
        "followup_complaint_id": followup_complaint_id,
        "category": category,
        "location": location,
        "alert_message": alert_message,
        "evidence_assessment": evidence_assessment or "INCONCLUSIVE",
        "status": status,
        "review_notes": review_notes or "",
        "reviewed_by": reviewed_by,
        "created_at": now,
        "updated_at": now
    }


def create_qa_log_doc(
    query_id: str,
    user_id: str,
    question: str,
    detected_intent: str,
    answer: str,
    matched_record_count: int,
    execution_time_ms: float
) -> Dict[str, Any]:
    return {
        "query_id": query_id,
        "user_id": user_id,
        "question": question,
        "detected_intent": detected_intent,
        "answer": answer,
        "matched_record_count": matched_record_count,
        "execution_time_ms": round(execution_time_ms, 2),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

