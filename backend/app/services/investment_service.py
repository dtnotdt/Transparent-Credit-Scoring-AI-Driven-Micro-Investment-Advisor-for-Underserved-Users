"""
services/investment_service.py
───────────────────────────────
Generates investment allocation and projected growth for Low/Medium/High risk profiles.

Assumed annual return rates (cited from historical Indian market data):
─────────────────────────────────────────────────────────────────────────────
Asset               Worst   Avg     Best    Source / Assumption
─────────────────────────────────────────────────────────────────────────────
FD                  4.0%    6.5%    7.5%    SBI FD (2024 range)
Government Bonds    4.5%    7.0%    8.0%    G-Sec 10-year yield range
Debt Mutual Fund    5.0%    7.5%    9.0%    Debt MF category avg (5-yr)
Hybrid Fund         7.0%    10.0%   13.0%   Balanced advantage funds
Index Fund          8.0%    12.0%   16.0%   Nifty 50 historical avg
Gold ETF            6.0%    9.0%    14.0%   Gold price CAGR (10-yr India)
Equity Mutual Fund  6.0%    13.0%   20.0%   Actively managed large-cap avg
ETF                 7.0%    12.5%   18.0%   Nifty-based ETF range
Blue-chip Equity    5.0%    11.0%   17.0%   Blue-chip basket historical
─────────────────────────────────────────────────────────────────────────────
All figures are illustrative and not guaranteed returns.
"""
from __future__ import annotations

import math

from app.schemas.credit import (
    InvestmentPlanRequest,
    InvestmentPlanResponse,
    ScenarioProjection,
)

# ── Allocation per risk band ──────────────────────────────────────────────────
ALLOCATIONS: dict[str, dict[str, float]] = {
    "Low":    {"FD": 40.0, "Government Bonds": 35.0, "Debt Mutual Fund": 25.0},
    "Medium": {"Hybrid Fund": 35.0, "Index Fund": 35.0, "Gold ETF": 30.0},
    "High":   {"Equity Mutual Fund": 40.0, "ETF": 35.0, "Blue-chip Equity": 25.0},
}

# Annual rates: {asset: {worst, avg, best}}
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


def _portfolio_rate(allocation: dict[str, float], scenario: str) -> float:
    """Blended weighted annual rate for a portfolio."""
    total_weight = sum(allocation.values())
    return sum(
        (pct / total_weight) * RATES[asset][scenario]
        for asset, pct in allocation.items()
    )


def _future_value_sip(monthly: float, annual_rate: float, years: int) -> float:
    """Future value of a monthly SIP using compound interest formula.
       FV = P * [((1+r)^n - 1) / r] * (1+r)
       where r = monthly rate, n = total months.
    """
    r = annual_rate / 12
    n = years * 12
    if r == 0:
        return monthly * n
    return monthly * (((1 + r) ** n - 1) / r) * (1 + r)


def generate_investment_plan(req: InvestmentPlanRequest) -> InvestmentPlanResponse:
    allocation = ALLOCATIONS[req.risk_level]

    projections: dict[str, ScenarioProjection] = {}
    total_invested: dict[str, float] = {}

    for years in [1, 3, 5]:
        key = f"{years}y"
        invested = req.monthly_investment * 12 * years
        total_invested[key] = round(invested, 2)

        projections[key] = ScenarioProjection(
            worst=round(_future_value_sip(
                req.monthly_investment,
                _portfolio_rate(allocation, "worst"),
                years,
            ), 2),
            avg=round(_future_value_sip(
                req.monthly_investment,
                _portfolio_rate(allocation, "avg"),
                years,
            ), 2),
            best=round(_future_value_sip(
                req.monthly_investment,
                _portfolio_rate(allocation, "best"),
                years,
            ), 2),
        )

    return InvestmentPlanResponse(
        risk_level=req.risk_level,
        allocation=allocation,
        projections=projections,
        assumed_rates={asset: RATES[asset] for asset in allocation},
        total_invested=total_invested,
    )
