"""
ETL Module: LOAD
Loads transformed records into the database (MongoDB / Embedded Document Store)
and logs ETL execution summary.
"""

import os
import sys
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.app.database.connection import get_collection
from backend.app.database.models import create_complaint_doc, create_etl_log_doc, create_user_doc
from backend.app.auth.security import get_password_hash


def load_records_to_database(records: List[Dict[str, Any]], stats: Dict[str, Any]) -> int:
    """Loads list of complaint dictionaries into database collections: complaints, users, etl_logs."""
    complaints_col = get_collection("complaints")
    etl_logs_col = get_collection("etl_logs")
    users_col = get_collection("users")
    
    # 1. Ensure default demo accounts exist
    if users_col.count_documents({"email": "citizen@civicsense.org"}) == 0:
        users_col.insert_one(create_user_doc(
            user_id="USR-CITIZEN-01",
            name="Anand Kumar (Citizen)",
            email="citizen@civicsense.org",
            password_hash=get_password_hash("citizen123"),
            role="citizen"
        ))
        
    if users_col.count_documents({"email": "officer@civicsense.org"}) == 0:
        users_col.insert_one(create_user_doc(
            user_id="USR-OFFICER-01",
            name="Divya Ramesh (Municipal Officer)",
            email="officer@civicsense.org",
            password_hash=get_password_hash("officer123"),
            role="officer"
        ))
        
    loaded_count = 0
    complaints_docs = []
    
    for row in records:
        doc = create_complaint_doc(
            complaint_id=row["complaint_id"],
            user_id="SYSTEM_ETL_NYC311",
            original_text=row["original_text"],
            language=row.get("language", "English"),
            source=row.get("source", "NYC_311_Dataset"),
            location=row.get("location", "City Location"),
            predicted_category=row["category"],
            confidence=0.95,
            status=row.get("status", "New")
        )
        complaints_docs.append(doc)
        
    if complaints_docs:
        existing_keys = {c.get("complaint_id") for c in complaints_col.find()}
        new_docs = [d for d in complaints_docs if d["complaint_id"] not in existing_keys]
        
        if new_docs:
            complaints_col.insert_many(new_docs)
            loaded_count = len(new_docs)
        else:
            loaded_count = len(complaints_docs)
            
    # 2. Record ETL Execution Log
    etl_log = create_etl_log_doc(
        source="NYC_311_Service_Requests_API",
        records_extracted=stats.get("extracted_count", len(records)),
        records_transformed=stats.get("transformed_count", len(records)),
        records_loaded=loaded_count,
        status="SUCCESS",
        details={
            "dropped_missing": stats.get("dropped_missing", 0),
            "dropped_duplicates": stats.get("dropped_duplicates", 0),
            "categories": stats.get("categories_distribution", {})
        }
    )
    etl_logs_col.insert_one(etl_log)
    
    print(f"[ETL-Load] Successfully loaded {loaded_count} complaints into database.")
    print(f"[ETL-Load] Logged ETL run status: SUCCESS.")
    return loaded_count


if __name__ == "__main__":
    from extract import extract_from_nyc311
    from transform import transform_records
    raw = extract_from_nyc311(500)
    records, stats = transform_records(raw)
    load_records_to_database(records, stats)
