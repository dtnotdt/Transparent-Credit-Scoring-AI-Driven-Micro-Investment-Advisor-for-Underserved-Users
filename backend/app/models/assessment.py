"""
models/assessment.py  —  Stores credit score assessments and risk profiles.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, JSON, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CreditAssessment(Base):
    __tablename__ = "credit_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Input features
    recharge_frequency: Mapped[float] = mapped_column(Float, nullable=False)
    bill_payment_regularity: Mapped[float] = mapped_column(Float, nullable=False)
    upi_transaction_count: Mapped[float] = mapped_column(Float, nullable=False)
    wallet_usage_score: Mapped[float] = mapped_column(Float, nullable=False)
    monthly_savings_pct: Mapped[float] = mapped_column(Float, nullable=False)
    ecommerce_frequency: Mapped[float] = mapped_column(Float, nullable=False)
    bank_balance_stability: Mapped[float] = mapped_column(Float, nullable=False)

    # Outputs
    credit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    shap_top3: Mapped[dict] = mapped_column(JSON, nullable=True)
    suggestions: Mapped[list] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    answers: Mapped[dict] = mapped_column(JSON, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    rationale: Mapped[str] = mapped_column(String(1000), nullable=True)
    score_breakdown: Mapped[dict] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
