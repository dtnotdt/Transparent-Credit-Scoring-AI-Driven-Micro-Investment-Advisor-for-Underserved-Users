"""
models/user.py  —  SQLAlchemy User model.
"""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # RBAC role — "USER" (default) or "ADMIN"
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="USER", server_default="USER")
    # Authentication provider — "local" (default) or "google"
    auth_provider: Mapped[str] = mapped_column(String(20), nullable=False, default="local", server_default="local")
    # User's preferred language for chatbot — "en", "hi", or "gu"
    preferred_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", server_default="en")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

