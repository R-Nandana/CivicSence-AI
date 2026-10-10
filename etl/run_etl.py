"""
ETL Pipeline Orchestrator
Executes complete EXTRACT -> TRANSFORM -> LOAD pipeline for CivicSense.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from etl.extract import extract_from_nyc311
from etl.transform import transform_records
from etl.load import load_records_to_database


def run_pipeline(limit: int = 1200):
    print("==================================================")
    print("      CIVICSENSE ETL PIPELINE EXECUTION           ")
    print("==================================================")
    
    # STEP 1: EXTRACT
    print("\n>>> STEP 1: EXTRACTING REAL-WORLD DATA")
    raw_records = extract_from_nyc311(limit=limit)
    print(f"Extracted {len(raw_records)} raw records from NYC 311 Open Data.")
    
    # STEP 2: TRANSFORM
    print("\n>>> STEP 2: TRANSFORMING & NORMALIZING DATA")
    records_transformed, stats = transform_records(raw_records)
    print(f"Transformed into {len(records_transformed)} clean complaint records across {len(stats['categories_distribution'])} categories.")
    
    # STEP 3: LOAD
    print("\n>>> STEP 3: LOADING DATA INTO DATABASE & AUDIT LOGS")
    loaded_count = load_records_to_database(records_transformed, stats)
    print(f"Successfully loaded {loaded_count} complaints into database.")
    
    print("\n==================================================")
    print("      ETL PIPELINE COMPLETED SUCCESSFULLY         ")
    print("==================================================")
    return records_transformed, stats


if __name__ == "__main__":
    run_pipeline(limit=1200)
