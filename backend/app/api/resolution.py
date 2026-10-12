"""
CivicSense Resolution Monitoring & Inconsistency Alert Router
Allows municipal officers to inspect potential resolution inconsistencies and record determinations.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from collections import Counter

from backend.app.schemas.schemas import ResolutionAlertDecisionRequest
from backend.app.database.connection import get_collection
from backend.app.nlp.resolution_monitor import resolution_monitor_engine
from backend.app.api.auth import require_officer

router = APIRouter(prefix="/resolution", tags=["Resolution Monitoring & Inconsistency Alerts"])


@router.get("/alerts")
def get_resolution_alerts(
    status: Optional[str] = None,
    officer: dict = Depends(require_officer)
):
    """Fetches all resolution inconsistency alerts enriched with original & follow-up complaint details."""
    alerts = resolution_monitor_engine.get_all_alerts(status=status)
    return alerts


@router.post("/alerts/{alert_id}/determine")
def determine_resolution_alert(
    alert_id: str,
    req: ResolutionAlertDecisionRequest,
    officer: dict = Depends(require_officer)
):
    """
    Officer Determination on Inconsistency Alert:
    - CONFIRM_REOPEN: Confirms the issue is indeed not resolved, reopening the complaint
    - DISMISS_ALERT: Concludes authority repair was valid, dismisses alert
    - MAINTAIN_RESOLVED: Maintains resolution status with explanation
    """
    res = resolution_monitor_engine.record_officer_determination(
        alert_id=alert_id,
        decision=req.decision,
        officer_name=officer.get("name", officer.get("email")),
        notes=req.notes
    )
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("error", "Alert resolution failed."))
    return res


@router.get("/stats")
def get_resolution_stats(officer: dict = Depends(require_officer)):
    """Computes resolution monitoring KPI metrics."""
    alerts_col = get_collection("resolution_alerts")
    all_alerts = alerts_col.find()
    if not all_alerts:
        resolution_monitor_engine._auto_seed_demo_alerts()
        all_alerts = alerts_col.find()

    statuses = Counter(a.get("status", "PENDING_VERIFICATION") for a in all_alerts)
    categories = Counter(a.get("category", "General") for a in all_alerts)

    return {
        "total_alerts": len(all_alerts),
        "pending_count": statuses.get("PENDING_VERIFICATION", 0),
        "confirmed_unresolved_count": statuses.get("CONFIRMED_UNRESOLVED", 0),
        "dismissed_count": statuses.get("DISMISSED_RESOLVED", 0),
        "category_distribution": dict(categories.most_common())
    }
