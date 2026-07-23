"""
services/risk_service.py
────────────────────────
Rule-based risk profiler. Fully inspectable weighted-score logic.
No black box — every decision path is documented.

Scoring rules (total 100 points):
  age                     : 0-15 pts  (younger = higher tolerance)
  investment_duration     : 0-20 pts  (longer horizon = higher tolerance)
  market_loss_reaction    : 0-25 pts  (buy_more=25, hold=15, panic_sell=0)
  has_emergency_fund      : 0-15 pts  (yes=15, no=0)
  monthly_savings_ratio   : 0-15 pts  (savings/income %)
  investment_amount_ratio : 0-10 pts  (investment/income %)

Risk bands:
  0-39   → Low
  40-69  → Medium
  70-100 → High
"""
from __future__ import annotations

from app.schemas.credit import RiskProfileRequest, RiskProfileResponse


def _score_age(age: int) -> int:
    """Younger investors have longer time to recover from losses."""
    if age < 30:
        return 15
    elif age < 40:
        return 12
    elif age < 50:
        return 8
    elif age < 60:
        return 4
    return 0


def _score_duration(years: int) -> int:
    """Longer horizon allows riding out market volatility."""
    if years >= 10:
        return 20
    elif years >= 5:
        return 15
    elif years >= 3:
        return 10
    elif years >= 1:
        return 5
    return 0


def _score_reaction(reaction: str) -> int:
    """Market downturn response is the strongest risk-tolerance signal."""
    return {"buy_more": 25, "hold": 15, "panic_sell": 0}.get(reaction, 0)


def _score_emergency_fund(has_fund: bool) -> int:
    """Emergency fund = ability to invest without panic-withdrawing."""
    return 15 if has_fund else 0


def _score_savings_ratio(savings: float, income: float) -> int:
    """Higher savings rate → more comfortable with investment risk."""
    if income <= 0:
        return 0
    ratio = (savings / income) * 100
    if ratio >= 25:
        return 15
    elif ratio >= 15:
        return 10
    elif ratio >= 8:
        return 6
    elif ratio >= 3:
        return 3
    return 0


def _score_investment_ratio(amount: float, income: float) -> int:
    """
    Investing a smaller % of income = conservative.
    Investing a larger % but having capacity = aggressive.
    """
    if income <= 0:
        return 0
    ratio = (amount / income) * 100
    if ratio >= 30:
        return 10
    elif ratio >= 15:
        return 7
    elif ratio >= 5:
        return 4
    return 1


def classify_risk(req: RiskProfileRequest) -> RiskProfileResponse:
    breakdown = {
        "age_score":             _score_age(req.age),
        "duration_score":        _score_duration(req.investment_duration_years),
        "reaction_score":        _score_reaction(req.market_loss_reaction),
        "emergency_fund_score":  _score_emergency_fund(req.has_emergency_fund),
        "savings_ratio_score":   _score_savings_ratio(req.monthly_savings, req.monthly_income),
        "investment_ratio_score": _score_investment_ratio(req.investment_amount, req.monthly_income),
    }
    total = sum(breakdown.values())

    if total >= 70:
        risk_level = "High"
        rationale = (
            f"Your total risk score is {total}/100. You have a long investment horizon, "
            "strong savings discipline, and calm reaction to market downturns — "
            "you can comfortably pursue growth-oriented investments."
        )
    elif total >= 40:
        risk_level = "Medium"
        rationale = (
            f"Your total risk score is {total}/100. You have moderate risk capacity. "
            "A balanced portfolio of hybrid and index funds would suit your profile."
        )
    else:
        risk_level = "Low"
        rationale = (
            f"Your total risk score is {total}/100. Capital preservation is the priority. "
            "Fixed deposits, government bonds, and debt funds provide stability "
            "while your risk capacity grows."
        )

    return RiskProfileResponse(
        risk_level=risk_level,
        answers_echo=req.model_dump(),
        rationale=rationale,
        score_breakdown=breakdown,
    )
