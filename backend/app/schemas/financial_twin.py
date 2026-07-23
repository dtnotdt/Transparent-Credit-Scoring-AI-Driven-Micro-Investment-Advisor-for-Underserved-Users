"""
schemas/financial_twin.py  —  Pydantic schemas for Financial Twin feature.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FinancialTwinProjection(BaseModel):
    """Projected financial state at a future point in time."""
    credit_score: int = Field(ge=300, le=900, description="Projected credit score")
    savings: float = Field(ge=0, description="Projected monthly savings amount (Rs)")
    investment_value: float = Field(ge=0, description="Projected cumulative investment value (Rs)")
    net_worth: float = Field(ge=0, description="Projected total net worth (Rs)")
    risk_level: str = Field(description="Projected risk profile: Low | Medium | High")


class FinancialTwinRequest(BaseModel):
    """
    Optional overrides for Financial Twin generation.
    If not provided, values are derived from latest stored assessments.
    """
    monthly_income: Optional[float] = Field(default=None, gt=0, description="Monthly income override (Rs)")
    monthly_savings: Optional[float] = Field(default=None, ge=0, description="Monthly savings override (Rs)")
    monthly_investment: Optional[float] = Field(default=None, ge=0, description="Monthly investment override (Rs)")


class FinancialTwinResponse(BaseModel):
    """Complete Financial Twin response including today's snapshot and future projections."""
    twin_id: int
    user_id: int
    generated_at: str

    # ── Today's Snapshot ──────────────────────────────────────────────────────
    current_credit_score: int
    current_savings_monthly: float
    current_investment_monthly: float
    current_risk_level: str

    # ── Future Projections ────────────────────────────────────────────────────
    projection_1y: FinancialTwinProjection
    projection_3y: FinancialTwinProjection
    projection_5y: FinancialTwinProjection

    # ── AI Coach ─────────────────────────────────────────────────────────────
    coach_summary: str

    disclaimer: str = (
        "⚠️ This Financial Twin simulation is for educational purposes only. "
        "Projections are based on historical market data and current financial behavior. "
        "They do not constitute regulated financial advice. "
        "Past performance is not indicative of future results."
    )
