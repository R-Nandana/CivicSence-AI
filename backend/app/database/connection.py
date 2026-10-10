"""
CivicSense Database Adapter
Supports MongoDB (via pymongo) with an automatic embedded SQLite Document Store fallback
providing high reliability across different execution environments.
"""

import os
import json
import sqlite3
import datetime
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "civicsense_db")
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(ROOT_DIR, "data")


class EmbeddedCollection:
    """SQLite-backed JSON collection mimicking PyMongo collection API."""
    def __init__(self, db_path: str, collection_name: str):
        self.db_path = db_path
        self.name = collection_name
        self._init_table()

    def _get_conn(self):
        return sqlite3.connect(self.db_path)

    def _init_table(self):
        with self._get_conn() as conn:
            conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {self.name} (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        doc_id = str(doc_copy.get("_id") or doc_copy.get("complaint_id") or doc_copy.get("user_id") or os.urandom(8).hex())
        doc_copy["_id"] = doc_id
        
        # Serialize datetime objects
        serialized = json.dumps(doc_copy, default=str)
        with self._get_conn() as conn:
            conn.execute(
                f"INSERT OR REPLACE INTO {self.name} (id, data) VALUES (?, ?)",
                (doc_id, serialized)
            )
            conn.commit()
        return type("InsertResult", (), {"inserted_id": doc_id})()

    def insert_many(self, documents: List[Dict[str, Any]]):
        ids = []
        with self._get_conn() as conn:
            for doc in documents:
                doc_copy = dict(doc)
                doc_id = str(doc_copy.get("_id") or doc_copy.get("complaint_id") or doc_copy.get("user_id") or os.urandom(8).hex())
                doc_copy["_id"] = doc_id
                ids.append(doc_id)
                serialized = json.dumps(doc_copy, default=str)
                conn.execute(
                    f"INSERT OR REPLACE INTO {self.name} (id, data) VALUES (?, ?)",
                    (doc_id, serialized)
                )
            conn.commit()
        return type("InsertManyResult", (), {"inserted_ids": ids})()

    def find_one(self, filter_dict: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        results = self.find(filter_dict)
        return results[0] if results else None

    def find(self, filter_dict: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.execute(f"SELECT data FROM {self.name} ORDER BY rowid DESC")
            rows = cursor.fetchall()
            
        items = [json.loads(row[0]) for row in rows]
        if not filter_dict:
            return items
            
        filtered = []
        for item in items:
            match = True
            for k, v in filter_dict.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(item)
        return filtered

    def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]):
        target = self.find_one(filter_dict)
        if not target:
            return type("UpdateResult", (), {"modified_count": 0})()
            
        if "$set" in update_dict:
            target.update(update_dict["$set"])
        else:
            target.update(update_dict)
            
        doc_id = str(target.get("_id"))
        serialized = json.dumps(target, default=str)
        with self._get_conn() as conn:
            conn.execute(
                f"UPDATE {self.name} SET data = ? WHERE id = ?",
                (serialized, doc_id)
            )
            conn.commit()
        return type("UpdateResult", (), {"modified_count": 1})()

    def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        return len(self.find(filter_dict))


class EmbeddedDatabase:
    """Mock Database object managing collections."""
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._collections = {}

    def __getitem__(self, name: str) -> EmbeddedCollection:
        if name not in self._collections:
            self._collections[name] = EmbeddedCollection(self.db_path, name)
        return self._collections[name]

    def get_collection(self, name: str) -> EmbeddedCollection:
        return self[name]


class DatabaseManager:
    _instance = None
    
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mongo = False
        self._initialize()

    def _initialize(self):
        # Attempt MongoDB connection with 1.5s timeout
        try:
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1500)
            client.server_info()  # Forces a call
            self.client = client
            self.db = client[DATABASE_NAME]
            self.is_mongo = True
            print(f"[Database] Connected successfully to MongoDB at {MONGODB_URI}")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            db_dir = os.path.join(DATA_DIR, "processed")
            os.makedirs(db_dir, exist_ok=True)
            db_path = os.path.join(db_dir, "civicsense_storage.db")
            self.db = EmbeddedDatabase(db_path)
            self.is_mongo = False
            print(f"[Database] MongoDB not reachable ({e}). Initialized robust Embedded Document Store at {db_path}")

    def get_collection(self, name: str):
        if self.is_mongo:
            return self.db[name]
        return self.db.get_collection(name)


db_manager = DatabaseManager()

def get_db():
    return db_manager.db

def get_collection(name: str):
    return db_manager.get_collection(name)
