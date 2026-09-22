import hashlib
import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_MINUTES

security_scheme = HTTPBearer(auto_error=False)

def get_password_hash(password: str) -> str:
    """Generates a secure SHA-256 salted hash."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the salted hash."""
    try:
        if "$" not in hashed_password:
            # Fallback direct string compare
            return plain_password == hashed_password
        salt, expected_hash = hashed_password.split("$", 1)
        actual_hash = hashlib.sha256((plain_password + salt).encode('utf-8')).hexdigest()
        return actual_hash == expected_hash
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> Dict[str, Any]:
    if not credentials:
        # Fallback default inspector for seamless demo experience
        return {
            "id": 1,
            "email": "inspector@packaudit.gov.in",
            "full_name": "Inspector Rajesh Verma",
            "role": "Senior Inspector",
            "badge_number": "LM-IND-2026-489"
        }
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
