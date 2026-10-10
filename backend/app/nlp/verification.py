"""
CivicSense NLP: Complaint Authenticity & Truthfulness Verification Engine
Validates whether submitted complaints are plausible, genuine, and geographically verifiable,
filtering out spam, gibberish, non-civic text, and unlocatable issues.
"""

import re
from typing import Dict, Any, List, Optional


class ComplaintVerifier:
    """Verifies authenticity, geographic grounding, and plausibility of civic complaints."""

    def __init__(self):
        # Known civic keyword patterns indicating genuine municipal problems
        self.civic_problem_patterns = [
            r"pothole|road|crater|asphalt|tar|pavement|traffic",
            r"water|drinking\s*water|pipeline|leak|supply|tap|borewell|kudineer|thanni",
            r"streetlight|street\s*light|lamp|bulb|dark|wire|electric|vilakku",
            r"drainage|sewer|manhole|gutter|overflow|stagnant|saakadai",
            r"garbage|waste|trash|dump|bin|debris|smell|kuppai",
            r"work\s*aagala|broken|damaged|overflowing|not\s*working|hazard"
        ]

        # Landmark / location patterns
        self.location_patterns = [
            r"gps:|\bward\b|\bblock\b|\bstreet\b|\broad\b|\bnagar\b|\blane\b|\bave\b|\bavenue\b",
            r"\bnear\b|\bopposite\b|\bopp\b|\bbehind\b|\bbus\s*stand\b|\bjunction\b|\bcross\b",
            r"\bcolony\b|\blocality\b|\bcircle\b|\bschool\b|\bhospital\b|\bpakkathula\b"
        ]

    def verify_complaint(self, text: str, location: str, predicted_category: str, confidence: float, entities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes multi-factor truthfulness & authenticity verification:
        1. Linguistic Coherence & Spam Filter
        2. Civic Grounding & Entity Coherence
        3. Geographic / Landmark Verifiability
        4. Category-Confidence Plausibility
        Returns structured verification verdict with score and explanations.
        """
        checks = []
        score = 0
        total_weight = 100

        clean_text = (text or "").strip()
        clean_loc = (location or "").strip()

        # -------------------------------------------------------------
        # CHECK 1: Linguistic Coherence & Spam Filter (Weight: 25)
        # -------------------------------------------------------------
        words = clean_text.split()
        if len(words) < 3:
            checks.append({
                "factor": "Complaint Length & Detail",
                "status": "Failed",
                "score": 0,
                "max": 25,
                "reason": "Text is too brief to describe a verifiable physical issue (minimum 3 words required)."
            })
        elif re.match(r"^(.)\1{4,}$", clean_text) or len(set(clean_text.lower())) < 4:
            checks.append({
                "factor": "Spam / Gibberish Detection",
                "status": "Failed",
                "score": 0,
                "max": 25,
                "reason": "Repetitive or nonsensical text detected."
            })
        else:
            checks.append({
                "factor": "Linguistic Coherence",
                "status": "Passed",
                "score": 25,
                "max": 25,
                "reason": f"Complaint contains coherent narrative syntax ({len(words)} descriptive words)."
            })
            score += 25

        # -------------------------------------------------------------
        # CHECK 2: Civic Grounding & Domain Relevance (Weight: 30)
        # -------------------------------------------------------------
        text_lower = clean_text.lower()
        matched_problem = False
        for pat in self.civic_problem_patterns:
            if re.search(pat, text_lower):
                matched_problem = True
                break

        has_infrastructure_or_dept = any(e.get("entity_type") in ["INFRASTRUCTURE", "DEPARTMENT", "DURATION"] for e in entities)

        if matched_problem or has_infrastructure_or_dept:
            civic_score = 30
            checks.append({
                "factor": "Civic Issue Relevance",
                "status": "Passed",
                "score": 30,
                "max": 30,
                "reason": f"Identified verifiable physical infrastructure indicators for category '{predicted_category}'."
            })
            score += 30
        else:
            checks.append({
                "factor": "Civic Issue Relevance",
                "status": "Warning",
                "score": 10,
                "max": 30,
                "reason": "Limited physical civic keywords isolated; relies purely on statistical model pattern."
            })
            score += 10

        # -------------------------------------------------------------
        # CHECK 3: Geographic & Landmark Grounding (Weight: 30)
        # -------------------------------------------------------------
        loc_lower = f"{clean_loc} {clean_text}".lower()
        has_location_entity = any(e.get("entity_type") == "LOCATION" for e in entities)
        has_geo_pattern = any(re.search(pat, loc_lower) for pat in self.location_patterns)
        is_gps = "gps:" in clean_loc.lower() or "°" in clean_loc or "lat" in clean_loc.lower()

        if is_gps or (clean_loc and (has_geo_pattern or len(clean_loc) >= 5)):
            loc_score = 30
            checks.append({
                "factor": "Location Verifiability",
                "status": "Passed",
                "score": 30,
                "max": 30,
                "reason": f"Specific ground location provided ('{clean_loc}') suitable for field navigation."
            })
            score += 30
        elif has_location_entity:
            checks.append({
                "factor": "Location Verifiability",
                "status": "Passed",
                "score": 25,
                "max": 30,
                "reason": "Location extracted automatically from complaint narrative."
            })
            score += 25
        else:
            checks.append({
                "factor": "Location Verifiability",
                "status": "Failed",
                "score": 0,
                "max": 30,
                "reason": "No landmark, street, or GPS provided. Field crew cannot locate issue."
            })

        # -------------------------------------------------------------
        # CHECK 4: Model Confidence Plausibility (Weight: 15)
        # -------------------------------------------------------------
        if confidence >= 0.70:
            checks.append({
                "factor": "AI Classification Confidence",
                "status": "Passed",
                "score": 15,
                "max": 15,
                "reason": f"High model certainty ({confidence * 100:.1f}%) matching category '{predicted_category}'."
            })
            score += 15
        elif confidence >= 0.40:
            checks.append({
                "factor": "AI Classification Confidence",
                "status": "Passed",
                "score": 10,
                "max": 15,
                "reason": f"Moderate model certainty ({confidence * 100:.1f}%)."
            })
            score += 10
        else:
            checks.append({
                "factor": "AI Classification Confidence",
                "status": "Warning",
                "score": 5,
                "max": 15,
                "reason": f"Low model certainty ({confidence * 100:.1f}%). May require manual inspection."
            })
            score += 5

        # -------------------------------------------------------------
        # FINAL VERDICT
        # -------------------------------------------------------------
        authenticity_score = min(100, max(0, score))
        has_failed_location = any(c["factor"] == "Location Verifiability" and c["status"] == "Failed" for c in checks)
        has_failed_spam = any(c["factor"] in ["Linguistic Coherence", "Spam / Gibberish Detection"] and c["status"] == "Failed" for c in checks)

        if has_failed_spam:
            verdict = "Rejected - Gibberish / Incoherent Content"
            is_genuine = False
            badge = "badge-rose"
        elif has_failed_location:
            verdict = "Rejected - Missing Verifiable Landmark"
            is_genuine = False
            badge = "badge-rose"
        elif authenticity_score >= 70:
            verdict = "Verified Genuine Civic Issue"
            is_genuine = True
            badge = "badge-green"
        elif authenticity_score >= 45:
            verdict = "Plausible Issue - Field Inspection Scheduled"
            is_genuine = True
            badge = "badge-amber"
        else:
            verdict = "Unverified - Insufficient Evidence"
            is_genuine = False
            badge = "badge-rose"

        return {
            "authenticity_score": authenticity_score,
            "is_genuine": is_genuine,
            "verdict": verdict,
            "badge_class": badge,
            "checks": checks,
            "requires_location_prompt": has_failed_location
        }


complaint_verifier = ComplaintVerifier()
