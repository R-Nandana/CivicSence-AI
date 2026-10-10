"""
CivicSense Core Differentiator: Related Complaints & Issue Evolution Matching Engine
Connects:
1. Category match
2. Extracted location and landmark entity overlap
3. TF-IDF text semantic similarity
4. Temporal proximity
Classifies relationships into:
- LIKELY_DUPLICATE
- NEW_REPORT_SAME_ISSUE
- FOLLOW_UP_PERSISTING
- NEW_ISSUE_SAME_LOCATION
Maintains Issue Groups and generates end-to-end chronological Issue Timelines.
"""

import os
import uuid
import math
import datetime
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter

from backend.app.database.connection import get_collection
from backend.app.database.models import (
    create_issue_group_doc,
    create_timeline_event_doc
)


class RelatedIssueEngine:
    """Multi-factor Related Issue & Temporal Evolution Matching Engine."""

    def __init__(self, similarity_threshold: float = 0.55):
        self.similarity_threshold = similarity_threshold

    @staticmethod
    def _text_cosine_similarity(text1: str, text2: str) -> float:
        """Computes word n-gram cosine similarity between two texts."""
        def get_tokens(t):
            words = [w.lower().strip() for w in t.split() if len(w) > 2]
            # Unigrams and bigrams
            bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
            return Counter(words + bigrams)

        c1 = get_tokens(text1)
        c2 = get_tokens(text2)

        intersection = set(c1.keys()) & set(c2.keys())
        numerator = sum(c1[t] * c2[t] for t in intersection)
        sum1 = sum(v ** 2 for v in c1.values())
        sum2 = sum(v ** 2 for v in c2.values())
        denominator = math.sqrt(sum1) * math.sqrt(sum2)

        if not denominator:
            return 0.0
        return round(float(numerator / denominator), 4)

    @staticmethod
    def _location_match_score(loc1: Optional[str], loc2: Optional[str]) -> float:
        """Evaluates geographic proximity based on location strings and landmarks."""
        l1 = (loc1 or "").lower().strip()
        l2 = (loc2 or "").lower().strip()

        if not l1 or not l2 or l1 == "not specified" or l2 == "not specified":
            return 0.10

        if l1 == l2:
            return 1.0

        w1 = set(l1.split())
        w2 = set(l2.split())
        overlap = w1 & w2
        if len(overlap) >= 2:
            return 0.85
        elif len(overlap) == 1:
            return 0.50
        return 0.0

    def compute_relatedness(
        self,
        candidate_text: str,
        candidate_category: str,
        candidate_location: str,
        existing_complaint: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Computes composite multi-factor relatedness score between candidate complaint
        and an existing complaint in the database.
        """
        ex_text = existing_complaint.get("original_text", "")
        ex_cat = existing_complaint.get("predicted_category", "")
        ex_loc = existing_complaint.get("location", "")
        ex_time_str = existing_complaint.get("created_at")

        # 1. Category Similarity (Weight: 0.25)
        cat_score = 1.0 if candidate_category.lower() == ex_cat.lower() else 0.0

        # 2. Location Similarity (Weight: 0.35)
        loc_score = self._location_match_score(candidate_location, ex_loc)

        # 3. Text Semantic Similarity (Weight: 0.30)
        text_sim = self._text_cosine_similarity(candidate_text, ex_text)

        # 4. Temporal Proximity (Weight: 0.10)
        temporal_score = 0.50
        days_delta = 5.0
        if ex_time_str:
            try:
                ex_dt = datetime.datetime.fromisoformat(ex_time_str)
                now_dt = datetime.datetime.now(datetime.timezone.utc)
                if ex_dt.tzinfo is None:
                    ex_dt = ex_dt.replace(tzinfo=datetime.timezone.utc)
                days_delta = abs((now_dt - ex_dt).total_seconds()) / 86400.0
                if days_delta <= 1.0:
                    temporal_score = 1.0
                elif days_delta <= 7.0:
                    temporal_score = 0.80
                elif days_delta <= 30.0:
                    temporal_score = 0.50
                else:
                    temporal_score = 0.20
            except Exception:
                pass

        # Composite Score Calculation
        composite = (
            (cat_score * 0.25) +
            (loc_score * 0.35) +
            (text_sim * 0.30) +
            (temporal_score * 0.10)
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        # Relationship Categorization
        ex_status = existing_complaint.get("status", "New")
        if loc_score >= 0.80 and cat_score == 0.0:
            rel_type = "NEW_ISSUE_SAME_LOCATION"
            rationale = f"Same location ('{candidate_location}') but distinct issue category ('{candidate_category}' vs '{ex_cat}')."
        elif composite >= 0.85 and days_delta <= 2.0:
            rel_type = "LIKELY_DUPLICATE"
            rationale = "Nearly identical wording and same physical location filed within 48 hours."
        elif ex_status in ["Resolved", "In Progress"] and composite >= 0.60:
            rel_type = "FOLLOW_UP_PERSISTING"
            rationale = f"Issue previously marked '{ex_status}' reported again by citizen, indicating persisting problem."
        elif composite >= self.similarity_threshold:
            rel_type = "NEW_REPORT_SAME_ISSUE"
            rationale = f"Independent citizen report concerning the same ongoing {candidate_category} problem at {candidate_location}."
        else:
            rel_type = "UNRELATED"
            rationale = "Insufficient similarity across category, location, and vocabulary."

        return {
            "composite_score": composite,
            "category_match": cat_score == 1.0,
            "location_score": round(loc_score, 2),
            "text_similarity": round(text_sim, 2),
            "temporal_proximity": round(temporal_score, 2),
            "relationship_type": rel_type,
            "rationale": rationale,
            "days_delta": round(days_delta, 1),
            "existing_complaint_id": existing_complaint.get("complaint_id"),
            "existing_status": ex_status
        }

    def find_related_complaints(
        self,
        candidate_text: str,
        category: str,
        location: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Scans database to find top matching complaints."""
        complaints_col = get_collection("complaints")
        recent = complaints_col.find()[:250]

        matches = []
        for comp in recent:
            res = self.compute_relatedness(candidate_text, category, location, comp)
            if res["composite_score"] >= 0.40 and res["relationship_type"] != "UNRELATED":
                matches.append({
                    **res,
                    "original_text": comp.get("original_text"),
                    "predicted_category": comp.get("predicted_category"),
                    "location": comp.get("location"),
                    "created_at": comp.get("created_at")
                })

        matches.sort(key=lambda m: m["composite_score"], reverse=True)
        return matches[:limit]

    def link_complaint_to_group(
        self,
        new_complaint_id: str,
        candidate_text: str,
        category: str,
        location: str
    ) -> Optional[Dict[str, Any]]:
        """
        Automatically attaches new complaint to an existing Issue Group or creates a new one
        if strong relation is detected.
        """
        groups_col = get_collection("issue_groups")
        timeline_col = get_collection("issue_timeline")

        matches = self.find_related_complaints(candidate_text, category, location, limit=1)
        if not matches or matches[0]["composite_score"] < 0.60:
            return None

        top_match = matches[0]
        match_id = top_match["existing_complaint_id"]
        rel_type = top_match["relationship_type"]

        # Check if matched complaint is already in an issue group
        existing_group = None
        for grp in groups_col.find():
            if match_id in grp.get("complaint_ids", []):
                existing_group = grp
                break

        if existing_group:
            # Append new complaint
            grp_id = existing_group["group_id"]
            updated_ids = list(set(existing_group.get("complaint_ids", []) + [new_complaint_id]))
            groups_col.update_one(
                {"group_id": grp_id},
                {"$set": {"complaint_ids": updated_ids, "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()}}
            )
            created_group = {**existing_group, "complaint_ids": updated_ids}
        else:
            # Create new Issue Group
            grp_id = f"GRP-{uuid.uuid4().hex[:6].upper()}"
            title = f"{category} Cluster: {location or 'Municipal Zone'}"
            group_doc = create_issue_group_doc(
                group_id=grp_id,
                title=title,
                category=category,
                location=location or "Unspecified",
                primary_complaint_id=match_id,
                complaint_ids=[match_id, new_complaint_id],
                relation_type=rel_type,
                similarity_score=top_match["composite_score"]
            )
            groups_col.insert_one(group_doc)
            created_group = group_doc

        # Record Timeline Event
        timeline_col.insert_one(create_timeline_event_doc(
            event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            complaint_id=new_complaint_id,
            event_type="FOLLOW_UP_REPORT" if rel_type == "FOLLOW_UP_PERSISTING" else "STATUS_CHANGE",
            title=f"Linked to Issue Group {grp_id}",
            description=f"Complaint categorized as '{rel_type}' (Similarity: {top_match['composite_score']*100:.1f}%) connected to {match_id}.",
            actor_role="SYSTEM_AI",
            actor_name="CivicSense Related Engine",
            metadata={"group_id": grp_id, "relation_type": rel_type, "similarity": top_match["composite_score"]}
        ))

        return created_group

    def build_complaint_timeline(self, complaint_id: str) -> List[Dict[str, Any]]:
        """
        Builds chronological event timeline for a complaint including submissions,
        evidence uploads, status updates, officer validations, and resolution notes.
        """
        timeline_col = get_collection("issue_timeline")
        complaints_col = get_collection("complaints")
        evidence_col = get_collection("evidence")
        feedback_col = get_collection("validated_feedback")

        events = []

        # 1. Complaint Base Submission Event
        comp = complaints_col.find_one({"complaint_id": complaint_id})
        if comp:
            events.append({
                "event_id": f"INIT-{complaint_id}",
                "event_type": "SUBMISSION",
                "title": f"Complaint Filed: {comp.get('predicted_category')}",
                "description": comp.get("original_text"),
                "actor_role": "CITIZEN",
                "actor_name": f"Citizen ({comp.get('user_id', 'Anonymous')})",
                "timestamp": comp.get("created_at"),
                "metadata": {
                    "category": comp.get("predicted_category"),
                    "confidence": comp.get("confidence"),
                    "location": comp.get("location"),
                    "status": comp.get("status")
                }
            })

        # 2. Evidence Events
        for ev in evidence_col.find({"complaint_id": complaint_id}):
            events.append({
                "event_id": ev.get("evidence_id"),
                "event_type": "EVIDENCE_UPLOAD",
                "title": f"Media Evidence Uploaded ({ev.get('media_type').upper()})",
                "description": f"Assessed as '{ev.get('evidence_assessment')}' with confidence {ev.get('confidence_score', 0)*100:.1f}%.",
                "actor_role": "CITIZEN",
                "actor_name": "Citizen",
                "timestamp": ev.get("created_at"),
                "metadata": {
                    "file_path": ev.get("file_path"),
                    "assessment": ev.get("evidence_assessment"),
                    "review_status": ev.get("officer_review_status")
                }
            })

        # 3. Officer Validation Events
        for fb in feedback_col.find({"complaint_id": complaint_id}):
            events.append({
                "event_id": f"VAL-{fb.get('_id', uuid.uuid4().hex[:6])}",
                "event_type": "OFFICER_VALIDATION",
                "title": "Officer AI Validation",
                "description": f"Officer validated category as '{fb.get('correct_category')}'. Notes: {fb.get('notes') or 'Verified'}",
                "actor_role": "OFFICER",
                "actor_name": fb.get("validated_by", "Officer"),
                "timestamp": fb.get("validation_date"),
                "metadata": fb
            })

        # 4. Explicit Timeline Audit Logs
        for t_evt in timeline_col.find({"complaint_id": complaint_id}):
            events.append(t_evt)

        # Sort chronologically
        events.sort(key=lambda e: e.get("timestamp") or "")
        return events


# Singleton Engine Instance
related_issue_engine = RelatedIssueEngine()
