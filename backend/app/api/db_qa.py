"""
CivicSense Database-Grounded Question Answering API Router
"""

from fastapi import APIRouter, Depends
from backend.app.schemas.schemas import DatabaseQARequest
from backend.app.nlp.db_qa import db_qa_engine
from backend.app.database.connection import get_collection
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/nlp/db-qa", tags=["Concept 6: Database-Grounded QA"])


@router.post("")
def query_database_qa(req: DatabaseQARequest, current_user: dict = Depends(get_current_user)):
    """
    Executes controlled database query against live complaints and evidence collections.
    Returns natural language response, applied filters, and exact supporting database records.
    """
    user_id = current_user.get("user_id", "ANONYMOUS")
    res = db_qa_engine.answer_question(req.question, user_id=user_id)
    return res


@router.get("/samples")
def get_sample_questions():
    """
    Returns mandated academic sample questions for the QA interface.
    """
    return {
        "sample_questions": [
            {
                "question": "How many unresolved streetlight complaints are there?",
                "category": "Streetlights",
                "description": "Queries complaints where category='Streetlights' and status in ['New', 'In Review', 'In Progress']"
            },
            {
                "question": "Which locations have recurring drainage complaints?",
                "category": "Drainage",
                "description": "Identifies geographic clusters and hotspots with repeated drainage and manhole issues"
            },
            {
                "question": "Which issues were reported again after being marked resolved?",
                "category": "Resolution Monitoring",
                "description": "Cross-references resolution inconsistency alerts and follow-up complaints"
            },
            {
                "question": "Which complaints have new image or video evidence?",
                "category": "Computer Vision",
                "description": "Filters complaints with attached photo or video verification records"
            },
            {
                "question": "How many complaints were submitted during a selected date range?",
                "category": "Analytics",
                "description": "Computes historical ingestion statistics between NYC 311 ETL and citizen submissions"
            }
        ]
    }


@router.get("/logs")
def get_qa_query_logs(current_user: dict = Depends(get_current_user)):
    """Fetches recent database QA query execution logs for QA analytics screen."""
    logs_col = get_collection("qa_query_logs")
    return logs_col.find()[:50]
