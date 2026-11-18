from datetime import datetime, timezone, timedelta
from typing import Generator, Optional, Dict, Tuple
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from jose import jwt, JWTError

from backend.app.core.config import settings
from backend.app.core.security import decode_token
from backend.app.db.session import get_session
from backend.app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

# In-memory rate limiting and failure lockout tracking:
# { ip: [timestamp, timestamp, ...] }
login_attempts: Dict[str, list] = {}
# { ip: lockout_until_datetime }
ip_lockouts: Dict[str, datetime] = {}
# { ip: failure_count }
ip_failures: Dict[str, int] = {}

def check_login_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = datetime.now(timezone.utc)

    # Check lockout
    if client_ip in ip_lockouts:
        lockout_time = ip_lockouts[client_ip]
        if now < lockout_time:
            remaining_seconds = int((lockout_time - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. IP locked for {remaining_seconds} seconds."
            )
        else:
            del ip_lockouts[client_ip]
            ip_failures[client_ip] = 0

    # Clean old requests older than 60 seconds
    attempts = [t for t in login_attempts.get(client_ip, []) if now - t < timedelta(minutes=1)]
    login_attempts[client_ip] = attempts

    if len(attempts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 5 login requests per minute."
        )

    login_attempts[client_ip].append(now)

def record_login_failure(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = datetime.now(timezone.utc)
    failures = ip_failures.get(client_ip, 0) + 1
    ip_failures[client_ip] = failures

    if failures >= 10:
        ip_lockouts[client_ip] = now + timedelta(minutes=10)

def record_login_success(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    if client_ip in ip_failures:
        del ip_failures[client_ip]
    if client_ip in ip_lockouts:
        del ip_lockouts[client_ip]

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    # Support token from Authorization header or httpOnly cookie
    auth_token = token
    if not auth_token:
        auth_token = request.cookies.get("access_token")

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(auth_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username: Optional[str] = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return user

def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
