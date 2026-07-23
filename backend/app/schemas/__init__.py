"""
schemas/__init__.py
"""
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.schemas.credit import (
    CreditScoreRequest,
    CreditScoreResponse,
    RiskProfileRequest,
    RiskProfileResponse,
    InvestmentPlanRequest,
    InvestmentPlanResponse,
    DashboardResponse,
    SampleUsersResponse,
    ShapExplanationResponse,
    CreditSimulationResponse,
    CoachRequest,
    CoachResponse,
)
from app.schemas.financial_twin import (
    FinancialTwinRequest,
    FinancialTwinResponse,
    FinancialTwinProjection,
)

__all__ = [
    "RegisterRequest", "LoginRequest", "TokenResponse", "UserResponse",
    "CreditScoreRequest", "CreditScoreResponse",
    "RiskProfileRequest", "RiskProfileResponse",
    "InvestmentPlanRequest", "InvestmentPlanResponse",
    "DashboardResponse", "SampleUsersResponse",
    "ShapExplanationResponse", "CreditSimulationResponse",
    "CoachRequest", "CoachResponse",
    "FinancialTwinRequest", "FinancialTwinResponse", "FinancialTwinProjection",
]
