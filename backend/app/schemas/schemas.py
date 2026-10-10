"""
CivicSense Pydantic API Schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# Auth Schemas
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=4)
    role: str = Field(default="citizen")  # 'citizen' or 'officer'


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


# Prediction & Complaint Schemas
class PredictRequest(BaseModel):
    complaint: str = Field(..., min_length=3)
    location: Optional[str] = None


class PredictResponse(BaseModel):
    original_text: str
    language: str
    normalized_processing_text: str
    predicted_category: str
    confidence: float
    model_version: str
    class_probabilities: Dict[str, float]
    entities: List[Dict[str, Any]]
    primary_location: str


class ComplaintCreateRequest(BaseModel):
    complaint_text: str = Field(..., min_length=5)
    location: Optional[str] = None


class ComplaintResponse(BaseModel):
    complaint_id: str
    user_id: str
    original_text: str
    language: str
    source: str
    location: str
    predicted_category: str
    confidence: float
    status: str
    entities: List[Dict[str, Any]]
    created_at: str
    updated_at: str


# Officer / Admin Schemas
class StatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(New|In Review|In Progress|Resolved|Rejected)$")


class ValidationFeedbackRequest(BaseModel):
    complaint_id: str
    original_prediction: str
    correct_category: str
    notes: Optional[str] = None


# Evidence Verification Schemas
class EvidenceReviewRequest(BaseModel):
    officer_review_status: str = Field(..., pattern="^(CONFIRMED|OVERRIDDEN)$")
    corrected_assessment: Optional[str] = Field(None, pattern="^(SUPPORTS_COMPLAINT|POTENTIAL_CONFLICT|INCONCLUSIVE|REQUIRES_HUMAN_REVIEW)$")
    officer_notes: Optional[str] = None


# Related Complaints Schemas
class RelatedCheckRequest(BaseModel):
    complaint_text: str
    category: Optional[str] = None
    location: Optional[str] = None


# Resolution Monitoring Schemas
class ResolutionAlertDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(CONFIRM_REOPEN|DISMISS_ALERT|MAINTAIN_RESOLVED)$")
    notes: Optional[str] = None


# Database QA Schemas
class DatabaseQARequest(BaseModel):
    question: str = Field(..., min_length=3)

