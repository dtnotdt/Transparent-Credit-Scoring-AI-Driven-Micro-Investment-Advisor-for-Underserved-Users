"""
services/financial_twin_service.py
────────────────────────────────────
AI-powered Financial Twin projection engine.

Uses the user's REAL stored financial data to simulate future financial health:
  - Credit Score progression based on behavioral signals and current score tier
  - Savings growth using current savings rate + habit improvement assumptions
  - Investment value using SIP compound growth at risk-profile rates
  - Net Worth as aggregate of savings + investment value
  - Risk Level evolution (may improve as creditworthiness grows)

All projections are for EDUCATIONAL PURPOSES ONLY.
Based on historical Indian market data and credit behaviour research.
"""
from __future__ import annotations

import math
from typing import Optional

from sqlalchemy.orm import Session

from app.models.assessment import CreditAssessment, RiskAssessment
from app.models.financial_twin import FinancialTwin
from app.models.user import User
from app.schemas.financial_twin import FinancialTwinProjection, FinancialTwinResponse

# ── Investment rate assumptions (from investment_service.py) ─────────────────
RATES: dict[str, dict[str, float]] = {
    "FD":                   {"worst": 0.040, "avg": 0.065, "best": 0.075},
    "Government Bonds":     {"worst": 0.045, "avg": 0.070, "best": 0.080},
    "Debt Mutual Fund":     {"worst": 0.050, "avg": 0.075, "best": 0.090},
    "Hybrid Fund":          {"worst": 0.070, "avg": 0.100, "best": 0.130},
    "Index Fund":           {"worst": 0.080, "avg": 0.120, "best": 0.160},
    "Gold ETF":             {"worst": 0.060, "avg": 0.090, "best": 0.140},
    "Equity Mutual Fund":   {"worst": 0.060, "avg": 0.130, "best": 0.200},
    "ETF":                  {"worst": 0.070, "avg": 0.125, "best": 0.180},
    "Blue-chip Equity":     {"worst": 0.050, "avg": 0.110, "best": 0.170},
}

ALLOCATIONS: dict[str, dict[str, float]] = {
    "Low":    {"FD": 40.0, "Government Bonds": 35.0, "Debt Mutual Fund": 25.0},
    "Medium": {"Hybrid Fund": 35.0, "Index Fund": 35.0, "Gold ETF": 30.0},
    "High":   {"Equity Mutual Fund": 40.0, "ETF": 35.0, "Blue-chip Equity": 25.0},
}

# Default income if not available from risk assessment
_DEFAULT_INCOME = 30_000.0


def _portfolio_avg_rate(risk_level: str) -> float:
    """Weighted average annual return for a risk band."""
    alloc = ALLOCATIONS.get(risk_level, ALLOCATIONS["Medium"])
    total = sum(alloc.values())
    return sum((pct / total) * RATES[asset]["avg"] for asset, pct in alloc.items())


def _future_value_sip(monthly: float, annual_rate: float, years: int) -> float:
    """FV of monthly SIP: P * [((1+r)^n - 1) / r] * (1+r)"""
    r = annual_rate / 12
    n = years * 12
    if r == 0:
        return monthly * n
    return monthly * (((1 + r) ** n - 1) / r) * (1 + r)


def _project_credit_score(current_score: int, bill_regularity: float, savings_pct: float, years: int) -> int:
    """
    Project credit score growth based on current score tier and behavioral signals.
    
    Research-based assumptions:
    - Score 300-499: fastest improvement possible (20-40 pts/yr) with good behavior
    - Score 500-649: steady improvement (15-30 pts/yr)  
    - Score 650-749: moderate improvement (10-20 pts/yr)
    - Score 750-849: slow gains (5-12 pts/yr)
    - Score 850-900: ceiling effect (<5 pts/yr)
    
    Behavioral multiplier: bill_regularity and savings_pct boost the rate.
    """
    behavior_multiplier = min(1.5, 0.5 + (bill_regularity / 100) * 0.7 + (savings_pct / 40) * 0.3)
    
    score = float(current_score)
    for _ in range(years):
        if score < 500:
            annual_gain = 35 * behavior_multiplier
        elif score < 650:
            annual_gain = 22 * behavior_multiplier
        elif score < 750:
            annual_gain = 14 * behavior_multiplier
        elif score < 850:
            annual_gain = 8 * behavior_multiplier
        else:
            annual_gain = 3 * behavior_multiplier

        # Ceiling effect: diminishing returns near 900
        ceiling_factor = max(0.1, (900 - score) / 600)
        score = min(900, score + annual_gain * ceiling_factor)

    return int(round(score))


def _project_savings(monthly_savings: float, years: int, improvement_rate: float = 0.06) -> float:
    """
    Project monthly savings amount after `years`.
    improvement_rate: annual % increase in savings capacity (habit building).
    """
    return monthly_savings * ((1 + improvement_rate) ** years)


def _project_risk_level(current_risk: str, future_score: int, current_score: int) -> str:
    """
    Risk level may evolve as credit score improves and financial confidence grows.
    Conservative assumption: Low stays Low unless score improves >100 pts over 5 years.
    """
    score_gain = future_score - current_score
    if current_risk == "Low" and score_gain > 80:
        return "Medium"
    elif current_risk == "Medium" and score_gain > 120:
        return "High"
    return current_risk


def _generate_coach_summary(
    current_score: int,
    future_5y_score: int,
    current_risk: str,
    future_risk: str,
    savings_growth_pct: float,
    investment_5y: float,
) -> str:
    """Generate an AI-style coach summary explaining the projections."""
    score_gain = future_5y_score - current_score
    
    if current_score >= 750:
        opening = (
            f"Your credit score of {current_score} places you in the elite financial tier. "
            f"Over the next 5 years, disciplined saving and investment can push you to {future_5y_score}."
        )
    elif current_score >= 600:
        opening = (
            f"Starting from a solid foundation of {current_score}, your Financial Twin projects "
            f"a {score_gain}-point credit score improvement to {future_5y_score} over 5 years. "
            f"This is achievable by maintaining your current digital payment habits."
        )
    else:
        opening = (
            f"From your current score of {current_score}, consistent bill payments and savings discipline "
            f"can unlock a {score_gain}-point uplift to {future_5y_score} within 5 years — "
            f"moving you from credit-thin to credit-established territory."
        )

    investment_str = f"₹{investment_5y:,.0f}"
    savings_note = (
        f"Your monthly savings are projected to grow by ~{savings_growth_pct:.0f}% "
        f"as financial discipline compounds over time."
    )

    risk_note = (
        f"Your risk profile evolves from {current_risk} to {future_risk}, "
        f"unlocking access to higher-growth investment vehicles."
        if future_risk != current_risk
        else f"Your {current_risk} risk profile remains stable, continuing to benefit from "
        f"your current investment allocation."
    )

    return (
        f"{opening} {savings_note} Your cumulative 5-year investment portfolio is projected "
        f"to grow to {investment_str} under average market conditions. {risk_note} "
        f"These projections assume consistent financial behavior and are for educational purposes only."
    )


def generate_financial_twin(
    user: User,
    db: Session,
    monthly_income_override: Optional[float] = None,
    monthly_savings_override: Optional[float] = None,
    monthly_investment_override: Optional[float] = None,
) -> FinancialTwinResponse:
    """
    Generate a Financial Twin projection for the user using their real stored data.

    1. Fetches latest CreditAssessment + RiskAssessment from DB
    2. Derives today's financial snapshot
    3. Projects 1, 3, 5 years forward
    4. Persists the result and returns FinancialTwinResponse
    """
    # ── Step 1: Fetch latest real data ────────────────────────────────────────
    latest_credit = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == user.id)
        .order_by(CreditAssessment.created_at.desc())
        .first()
    )
    latest_risk = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.user_id == user.id)
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )

    if not latest_credit:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No credit assessment found. Please complete the Credit Score assessment first "
                "so your Financial Twin can be generated from real data."
            ),
        )

    # ── Step 2: Derive today's snapshot ──────────────────────────────────────
    current_score = latest_credit.credit_score
    current_risk = latest_risk.risk_level if latest_risk else "Medium"

    # Income: from risk assessment answers, or override, or default
    monthly_income = _DEFAULT_INCOME
    if monthly_income_override:
        monthly_income = monthly_income_override
    elif latest_risk and latest_risk.answers:
        monthly_income = float(latest_risk.answers.get("monthly_income", _DEFAULT_INCOME))

    # Monthly savings: from savings_pct × income
    if monthly_savings_override is not None:
        current_savings = monthly_savings_override
    else:
        savings_pct = latest_credit.monthly_savings_pct / 100.0
        current_savings = savings_pct * monthly_income

    # Monthly investment: from risk assessment, or override
    if monthly_investment_override is not None:
        current_investment = monthly_investment_override
    elif latest_risk and latest_risk.answers:
        current_investment = float(latest_risk.answers.get("investment_amount", max(500.0, current_savings * 0.5)))
    else:
        current_investment = max(500.0, current_savings * 0.5)

    # ── Step 3: Behavioral signals for credit score projection ────────────────
    bill_regularity = latest_credit.bill_payment_regularity
    savings_pct_raw = latest_credit.monthly_savings_pct

    # ── Step 4: Project across horizons ──────────────────────────────────────
    avg_rate = _portfolio_avg_rate(current_risk)
    savings_improvement_rate = 0.06  # 6% annual savings capacity growth (habit building)

    projections: dict[int, FinancialTwinProjection] = {}
    for years in [1, 3, 5]:
        future_score = _project_credit_score(current_score, bill_regularity, savings_pct_raw, years)
        future_savings = _project_savings(current_savings, years, savings_improvement_rate)
        future_investment_value = _future_value_sip(current_investment, avg_rate, years)
        future_risk = _project_risk_level(current_risk, future_score, current_score)

        # Net worth = cumulative savings + investment portfolio
        cumulative_savings = sum(
            _project_savings(current_savings, y, savings_improvement_rate) * 12
            for y in range(1, years + 1)
        )
        net_worth = cumulative_savings + future_investment_value

        projections[years] = FinancialTwinProjection(
            credit_score=future_score,
            savings=round(future_savings, 2),
            investment_value=round(future_investment_value, 2),
            net_worth=round(net_worth, 2),
            risk_level=future_risk,
        )

    # ── Step 5: AI Coach Summary ──────────────────────────────────────────────
    savings_growth_pct = ((projections[5].savings - current_savings) / max(current_savings, 1)) * 100
    coach_summary = _generate_coach_summary(
        current_score=current_score,
        future_5y_score=projections[5].credit_score,
        current_risk=current_risk,
        future_risk=projections[5].risk_level,
        savings_growth_pct=savings_growth_pct,
        investment_5y=projections[5].investment_value,
    )

    # ── Step 6: Persist to DB ─────────────────────────────────────────────────
    twin = FinancialTwin(
        user_id=user.id,
        current_credit_score=current_score,
        current_savings_monthly=round(current_savings, 2),
        current_investment_monthly=round(current_investment, 2),
        current_risk_level=current_risk,
        projections_1y=projections[1].model_dump(),
        projections_3y=projections[3].model_dump(),
        projections_5y=projections[5].model_dump(),
        coach_summary=coach_summary,
    )
    db.add(twin)
    db.commit()
    db.refresh(twin)

    # ── Step 7: Build and return response ─────────────────────────────────────
    return FinancialTwinResponse(
        twin_id=twin.id,
        user_id=user.id,
        generated_at=twin.created_at.isoformat(),
        current_credit_score=current_score,
        current_savings_monthly=round(current_savings, 2),
        current_investment_monthly=round(current_investment, 2),
        current_risk_level=current_risk,
        projection_1y=projections[1],
        projection_3y=projections[3],
        projection_5y=projections[5],
        coach_summary=coach_summary,
    )


def get_latest_financial_twin(user_id: int, db: Session) -> Optional[FinancialTwin]:
    """Retrieve the most recent Financial Twin for a user."""
    return (
        db.query(FinancialTwin)
        .filter(FinancialTwin.user_id == user_id)
        .order_by(FinancialTwin.created_at.desc())
        .first()
    )
