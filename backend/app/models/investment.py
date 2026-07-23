"""
models/investment.py  —  Investment plan recommendations.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, JSON, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InvestmentPlan(Base):
    __tablename__ = "investment_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    monthly_investment: Mapped[float] = mapped_column(Float, nullable=False)
    allocation: Mapped[dict] = mapped_column(JSON, nullable=False)
    projections: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
