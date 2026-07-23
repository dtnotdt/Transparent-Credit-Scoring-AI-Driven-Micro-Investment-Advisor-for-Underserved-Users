"""
api/v1/deps.py  —  Shared FastAPI dependencies.
Implements JWT validation and role-based access control (RBAC).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validates JWT and returns the authenticated user."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    RBAC guard — requires role == 'ADMIN'.
    Returns HTTP 403 Forbidden for non-admin users.
    Prevents horizontal privilege escalation by enforcing role checks server-side.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. You do not have permission to access this resource.",
        )
    return current_user


def require_own_resource(user_id: int, current_user: User) -> None:
    """
    Prevent horizontal privilege escalation: ensures a USER can only access
    their own resources. ADMINs are exempt.
    Raises HTTP 403 if the requesting user does not own the resource.
    """
    if current_user.role == "ADMIN":
        return  # Admins can access any resource
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only access your own data.",
        )
