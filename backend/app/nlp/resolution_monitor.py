"""
CivicSense Core Differentiator: Resolution Monitoring & Inconsistency Alert Engine
Detects potential inconsistencies when citizens file follow-up complaints or media evidence
for civic issues that were previously marked 'Resolved' by municipal authorities.
Uses strictly neutral, objective language and maintains a transparent audit trail.
"""

import os
import uuid
import datetime
from typing import Dict, Any, List, Optional

from backend.app.database.connection import get_collection
from backend.app.database.models import (
    create_resolution_alert_doc,
    create_timeline_event_doc
)
from backend.app.nlp.related_issues import related_issue_engine


class ResolutionMonitorEngine:
    """Monitors resolved civic issues for recurrence, follow-up reports, and evidence conflicts."""

    def __init__(self, recurrence_window_days: int = 45):
        self.recurrence_window_days = recurrence_window_days

    def check_for_inconsistency(
        self,
        new_complaint_id: str,
        new_text: str,
        category: str,
        location: str,
        evidence_assessment: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Inspects whether the newly submitted complaint or evidence conflicts
        with an earlier complaint in the same location that was marked 'Resolved'.
        """
        complaints_col = get_collection("complaints")
        alerts_col = get_collection("resolution_alerts")
        timeline_col = get_collection("issue_timeline")

        # Query past resolved complaints
        resolved_complaints = complaints_col.find({"status": "Resolved"})
        if not resolved_complaints:
            # Also check complaints with status 'Resolved' in recent items
            resolved_complaints = [c for c in complaints_col.find() if c.get("status") == "Resolved"]

        for orig in resolved_complaints:
            if orig.get("complaint_id") == new_complaint_id:
                continue

            rel = related_issue_engine.compute_relatedness(new_text, category, location, orig)
            score = rel["composite_score"]
            days_delta = rel["days_delta"]

            # If strongly related and within recurrence window
            if score >= 0.58 and days_delta <= self.recurrence_window_days:
                alert_id = f"ALT-RES-{uuid.uuid4().hex[:6].upper()}"
                
                # Neutral, professional phrasing as mandated by specifications
                neutral_msg = (
                    f"The new citizen report appears inconsistent with the current resolved status "
                    f"of earlier complaint {orig.get('complaint_id')} and requires verification."
                )

                alert_doc = create_resolution_alert_doc(
                    alert_id=alert_id,
                    original_complaint_id=orig.get("complaint_id"),
                    followup_complaint_id=new_complaint_id,
                    category=category,
                    location=location,
                    alert_message=neutral_msg,
                    evidence_assessment=evidence_assessment or "REQUIRES_HUMAN_REVIEW",
                    status="PENDING_VERIFICATION"
                )
                alerts_col.insert_one(alert_doc)

                # Add Timeline Audit Event for Original Complaint
                timeline_col.insert_one(create_timeline_event_doc(
                    event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
                    complaint_id=orig.get("complaint_id"),
                    event_type="INCONSISTENCY_FLAG",
                    title="Resolution Inconsistency Alert Triggered",
                    description=neutral_msg,
                    actor_role="SYSTEM_AI",
                    actor_name="CivicSense Resolution Monitor",
                    metadata={
                        "alert_id": alert_id,
                        "followup_id": new_complaint_id,
                        "similarity_score": score,
                        "days_since_resolution": days_delta
                    }
                ))

                # Add Timeline Audit Event for Follow-up Complaint
                timeline_col.insert_one(create_timeline_event_doc(
                    event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
                    complaint_id=new_complaint_id,
                    event_type="INCONSISTENCY_FLAG",
                    title="Linked to Resolved Case with Inconsistency Flag",
                    description=f"Flagged for municipal verification against previously resolved case {orig.get('complaint_id')}.",
                    actor_role="SYSTEM_AI",
                    actor_name="CivicSense Resolution Monitor",
                    metadata={"alert_id": alert_id, "original_id": orig.get("complaint_id")}
                ))

                return alert_doc

        return None

    def get_all_alerts(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches all resolution inconsistency alerts with hydrated complaint and evidence metadata."""
        alerts_col = get_collection("resolution_alerts")
        complaints_col = get_collection("complaints")
        evidence_col = get_collection("evidence")

        query = {"status": status} if status else {}
        alerts = alerts_col.find(query)

        enriched_alerts = []
        for alt in alerts:
            orig = complaints_col.find_one({"complaint_id": alt.get("original_complaint_id")})
            follow = complaints_col.find_one({"complaint_id": alt.get("followup_complaint_id")})
            ev_list = evidence_col.find({"complaint_id": alt.get("followup_complaint_id")})

            enriched_alerts.append({
                **alt,
                "original_complaint": orig,
                "followup_complaint": follow,
                "evidence_items": ev_list
            })

        return enriched_alerts

    def record_officer_determination(
        self,
        alert_id: str,
        decision: str,
        officer_name: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Records the final determination made by an authorized officer on an inconsistency alert:
        - CONFIRM_REOPEN: Reopens original issue as unresolved, moves follow-up to In Progress
        - DISMISS_ALERT: Concludes resolved status was accurate, flags follow-up as duplicate/isolated
        - MAINTAIN_RESOLVED: Records verification explanation without changing historical claim
        """
        alerts_col = get_collection("resolution_alerts")
        complaints_col = get_collection("complaints")
        timeline_col = get_collection("issue_timeline")

        alert = alerts_col.find_one({"alert_id": alert_id})
        if not alert:
            return {"success": False, "error": "Alert not found."}

        new_status = "CONFIRMED_UNRESOLVED" if decision == "CONFIRM_REOPEN" else "DISMISSED_RESOLVED"
        alerts_col.update_one(
            {"alert_id": alert_id},
            {"$set": {
                "status": new_status,
                "reviewed_by": officer_name,
                "review_notes": notes or "",
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }}
        )

        orig_id = alert.get("original_complaint_id")
        follow_id = alert.get("followup_complaint_id")

        if decision == "CONFIRM_REOPEN":
            # Reopen original issue
            complaints_col.update_one(
                {"complaint_id": orig_id},
                {"$set": {"status": "In Progress", "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()}}
            )
            complaints_col.update_one(
                {"complaint_id": follow_id},
                {"$set": {"status": "In Progress", "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()}}
            )

        # Record Audit Timeline Event
        timeline_col.insert_one(create_timeline_event_doc(
            event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            complaint_id=orig_id,
            event_type="OFFICER_VALIDATION",
            title=f"Officer Resolution Determination: {decision}",
            description=f"Officer {officer_name} evaluated inconsistency alert {alert_id}. Determination: {decision}. Notes: {notes or 'No notes'}",
            actor_role="OFFICER",
            actor_name=officer_name,
            metadata={"alert_id": alert_id, "decision": decision, "notes": notes}
        ))

        return {
            "success": True,
            "alert_id": alert_id,
            "decision": decision,
            "status": new_status,
            "officer": officer_name
        }


# Singleton Engine Instance
resolution_monitor_engine = ResolutionMonitorEngine()
