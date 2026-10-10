"""
Authentication Router
Endpoints for user registration, login, and profile retrieval with role validation.
"""

import os
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.app.schemas.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse
from backend.app.database.connection import get_collection
from backend.app.database.models import create_user_doc
from backend.app.auth.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_bearer = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid.")
        
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token.")
        
    user_col = get_collection("users")
    user = user_col.find_one({"email": payload.get("email")})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
        
    return user


def require_officer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Officer/Admin privileges required."
        )
    return current_user


@router.post("/register", response_model=TokenResponse)
def register(req: UserRegisterRequest):
    users_col = get_collection("users")
    
    # Check if user already exists
    existing = users_col.find_one({"email": req.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")
        
    user_id = f"USR-{os.urandom(4).hex().upper()}"
    password_hash = get_password_hash(req.password)
    
    user_doc = create_user_doc(
        user_id=user_id,
        name=req.name,
        email=req.email,
        password_hash=password_hash,
        role=req.role.lower()
    )
    users_col.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id, "email": user_doc["email"], "role": user_doc["role"], "name": user_doc["name"]})
    
    user_clean = {k: v for k, v in user_doc.items() if k != "password_hash"}
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_clean
    }


@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest):
    users_col = get_collection("users")
    user = users_col.find_one({"email": req.email.lower().strip()})
    
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = create_access_token({
        "sub": user["user_id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"]
    })
    
    user_clean = {k: v for k, v in user.items() if k != "password_hash"}
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_clean
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password_hash"}
