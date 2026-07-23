"""
models/financial_twin.py  —  Financial Twin simulation results.
Stores AI-generated future financial projections linked to a user.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FinancialTwin(Base):
    __tablename__ = "financial_twins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ── Today's Snapshot (derived from latest assessments) ────────────────────
    current_credit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    current_savings_monthly: Mapped[float] = mapped_column(Float, nullable=False)
    current_investment_monthly: Mapped[float] = mapped_column(Float, nullable=False)
    current_risk_level: Mapped[str] = mapped_column(String(20), nullable=False)

    # ── Projections per horizon (JSON) ────────────────────────────────────────
    # Each projection: {credit_score, savings, investment_value, net_worth, risk_level}
    projections_1y: Mapped[dict] = mapped_column(JSON, nullable=False)
    projections_3y: Mapped[dict] = mapped_column(JSON, nullable=False)
    projections_5y: Mapped[dict] = mapped_column(JSON, nullable=False)

    # ── AI Coach Summary ──────────────────────────────────────────────────────
    coach_summary: Mapped[str] = mapped_column(Text, nullable=False)

    # ── Metadata ──────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
