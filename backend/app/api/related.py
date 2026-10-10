"""
CivicSense Related Complaints & Issue Timeline Router
Exposes endpoints for:
- Checking related complaints & evolution patterns
- Retrieving issue clusters/groups
- Retrieving chronological issue evolution timelines
- Officer adjustment of groupings
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.app.schemas.schemas import RelatedCheckRequest
from backend.app.database.connection import get_collection
from backend.app.nlp.related_issues import related_issue_engine
from backend.app.api.auth import get_current_user, require_officer

router = APIRouter(prefix="/related", tags=["Related Complaints & Issue Evolution"])


class GroupOverrideRequest(BaseModel):
    group_id: str
    action: str  # 'REMOVE_COMPLAINT' | 'MERGE_GROUP' | 'UPDATE_RELATION'
    complaint_id: Optional[str] = None
    new_relation: Optional[str] = None
    notes: Optional[str] = None


@router.post("/check")
def check_related_complaints(
    req: RelatedCheckRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Checks candidate complaint text, category, and location against historical database records.
    Returns matched complaints, composite similarity scores, relationship types, and evolution rationale.
    """
    matches = related_issue_engine.find_related_complaints(
        candidate_text=req.complaint_text,
        category=req.category or "General",
        location=req.location or "Not Specified",
        limit=5
    )
    return {
        "candidate_category": req.category,
        "candidate_location": req.location,
        "total_related_found": len(matches),
        "matches": matches
    }


@router.get("/groups")
def get_issue_groups(officer: dict = Depends(require_officer)):
    """Fetches all clustered issue groups."""
    groups_col = get_collection("issue_groups")
    return groups_col.find()


@router.get("/groups/{group_id}")
def get_issue_group_detail(group_id: str, officer: dict = Depends(require_officer)):
    """Fetches detailed records for a specific issue group, including all member complaints."""
    groups_col = get_collection("issue_groups")
    complaints_col = get_collection("complaints")

    grp = groups_col.find_one({"group_id": group_id})
    if not grp:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    member_ids = grp.get("complaint_ids", [])
    members = []
    for cid in member_ids:
        comp = complaints_col.find_one({"complaint_id": cid})
        if comp:
            members.append(comp)

    return {
        "group": grp,
        "member_count": len(members),
        "member_complaints": members
    }


@router.get("/timeline/{complaint_id}")
def get_complaint_timeline(complaint_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns complete chronological event timeline for an issue:
    submission, status changes, AI classifications, evidence uploads, officer validations, resolution claims.
    """
    timeline = related_issue_engine.build_complaint_timeline(complaint_id)
    return {
        "complaint_id": complaint_id,
        "total_events": len(timeline),
        "timeline": timeline
    }


@router.post("/groups/override")
def override_issue_grouping(
    req: GroupOverrideRequest,
    officer: dict = Depends(require_officer)
):
    """Allows municipal officers to adjust or correct automated issue grouping."""
    groups_col = get_collection("issue_groups")
    grp = groups_col.find_one({"group_id": req.group_id})
    if not grp:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    if req.action == "REMOVE_COMPLAINT" and req.complaint_id:
        updated = [cid for cid in grp.get("complaint_ids", []) if cid != req.complaint_id]
        groups_col.update_one({"group_id": req.group_id}, {"$set": {"complaint_ids": updated}})
        return {"message": f"Complaint {req.complaint_id} removed from group {req.group_id}."}

    elif req.action == "UPDATE_RELATION" and req.new_relation:
        groups_col.update_one({"group_id": req.group_id}, {"$set": {"relation_type": req.new_relation}})
        return {"message": f"Group relation type updated to {req.new_relation}."}

    return {"message": "Grouping adjusted successfully."}
