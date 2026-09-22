from fastapi import APIRouter, HTTPException, status, Depends
from models.schemas import LoginRequest, TokenResponse, UserOut
from models.database import get_db_connection
from utils.security import verify_password, create_access_token, get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (payload.email.lower(),))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user_data = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "badge_number": user["badge_number"]
    }

    access_token = create_access_token(data=user_data)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.get("/me", response_model=Dict[str, Any])
def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
