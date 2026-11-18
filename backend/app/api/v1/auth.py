from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlmodel import Session, select

from backend.app.core.config import settings
from backend.app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from backend.app.core.deps import (
    get_current_user,
    get_current_active_admin,
    check_login_rate_limit,
    record_login_failure,
    record_login_success
)
from backend.app.db.session import get_session
from backend.app.models.user import User
from backend.app.models.audit import AuditLog
from backend.app.schemas.auth import (
    Token,
    LoginRequest,
    RefreshRequest,
    ChangePasswordRequest,
    UserCreate,
    UserRead
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    response: Response,
    request: Request,
    session: Session = Depends(get_session)
):
    check_login_rate_limit(request)

    statement = select(User).where(User.username == login_data.username)
    user = session.exec(statement).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        record_login_failure(request)
        # Log failed attempt
        client_ip = request.client.host if request.client else "127.0.0.1"
        audit = AuditLog(
            user_id=user.id if user else None,
            username=login_data.username,
            action="login_failure",
            details="Invalid username or password",
            ip_address=client_ip
        )
        session.add(audit)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    record_login_success(request)

    # Update user last_login
    user.last_login = datetime.now(timezone.utc)
    session.add(user)

    # Log successful login
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="login_success",
        details="User authenticated successfully",
        ip_address=client_ip
    )
    session.add(audit)
    session.commit()

    access_token = create_access_token(user.username)
    refresh_token = create_refresh_token(user.username)

    # Set httpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
        secure=False
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        must_change_password=user.must_change_password
    )

@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="logout",
        details="User logged out",
        ip_address=client_ip
    )
    session.add(audit)
    session.commit()

    return {"message": "Successfully logged out"}

@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_data: RefreshRequest,
    response: Response,
    session: Session = Depends(get_session)
):
    token = refresh_data.refresh_token
    payload = decode_token(token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    username = payload.get("sub")
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer active"
        )

    new_access_token = create_access_token(user.username)
    new_refresh_token = create_refresh_token(user.username)

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
        secure=False
    )

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        must_change_password=user.must_change_password
    )

@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return UserRead(
        id=current_user.id or 0,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        must_change_password=current_user.must_change_password,
        last_login=current_user.last_login.isoformat() if current_user.last_login else None
    )

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.must_change_password = False
    session.add(current_user)

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="password_change",
        details="User changed password",
        ip_address=client_ip
    )
    session.add(audit)
    session.commit()

    return {"message": "Password changed successfully"}

@router.post("/register", response_model=UserRead)
def register_user(
    user_in: UserCreate,
    current_admin: User = Depends(get_current_active_admin),
    session: Session = Depends(get_session)
):
    # Check if username exists
    existing_user = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    existing_email = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role or "user",
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        must_change_password=False
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return UserRead(
        id=new_user.id or 0,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active,
        must_change_password=new_user.must_change_password
    )
