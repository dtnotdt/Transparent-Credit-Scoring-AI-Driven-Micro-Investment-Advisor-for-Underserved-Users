"""
schemas/credit.py  —  Credit score and investment plan schemas.
"""
from typing import Any
from pydantic import BaseModel, Field, field_validator


# ─── Credit Score ─────────────────────────────────────────────────────────────

class CreditScoreRequest(BaseModel):
    recharge_frequency: float = Field(ge=0, le=30, description="Mobile recharges per month")
    bill_payment_regularity: float = Field(ge=0, le=100, description="% of bills paid on time (0-100)")
    upi_transaction_count: float = Field(ge=0, le=200, description="UPI transactions per month")
    wallet_usage_score: float = Field(ge=0, le=100, description="Digital wallet activity score (0-100)")
    monthly_savings_pct: float = Field(ge=0, le=40, description="% of income saved per month")
    ecommerce_frequency: float = Field(ge=0, le=60, description="E-commerce orders per month")
    bank_balance_stability: float = Field(ge=0, le=100, description="Bank balance stability score (0-100)")


class ShapContribution(BaseModel):
    feature: str
    contribution: float
    direction: str  # "positive" | "negative"
    display_label: str


class DetailedShapFeature(BaseModel):
    feature: str
    feature_name: str
    user_value: float
    shap_value: float
    direction: str  # "helps" | "hurts"
    impact_points: int
    english_explanation: str


class ShapExplanationResponse(BaseModel):
    user_id: int
    base_value: float
    final_score: int
    summary_headline: str
    features: list[DetailedShapFeature]
    disclaimer: str = (
        "This application is for educational purposes only and does not "
        "provide regulated financial or investment advice."
    )


class CreditSimulationResponse(BaseModel):
    old_score: int
    new_score: int
    delta: int
    explanation: str
    disclaimer: str = (
        "This application is for educational purposes only and does not "
        "provide regulated financial or investment advice."
    )


class CoachRequest(BaseModel):
    credit_score: int
    shap_factors: list[dict]
    monthly_savings_pct: float
    monthly_income: float
    risk_level: str | None = None
    language: str = "en"  # "en" | "hi" | "gu"
    messages: list[dict] | None = None  # for follow-up chat history



class CoachRecommendation(BaseModel):
    title: str
    detail: str
    impact_estimate: str


class CoachResponse(BaseModel):
    summary: str
    recommendations: list[CoachRecommendation]
    reply: str | None = None  # reply for follow-up chat
    disclaimer: str = (
        "This application is for educational purposes only and does not "
        "provide regulated financial or investment advice."
    )


class CreditScoreResponse(BaseModel):
    score: int = Field(ge=300, le=900)
    score_label: str  # Excellent / Good / Fair / Poor / Very Poor
    shap_top3: list[ShapContribution]
    suggestions: list[str]
    disclaimer: str = (
        "This application is for educational purposes only and does not "
        "provide regulated financial or investment advice."
    )


# ─── Risk Profile ─────────────────────────────────────────────────────────────

class RiskProfileRequest(BaseModel):
    age: int = Field(ge=18, le=100)
    monthly_income: float = Field(gt=0)
    occupation: str = Field(min_length=2, max_length=100)
    monthly_savings: float = Field(ge=0)
    investment_amount: float = Field(ge=0)
    has_emergency_fund: bool
    investment_duration_years: int = Field(ge=1, le=40)
    market_loss_reaction: str = Field(
        description="panic_sell | hold | buy_more"
    )

    @field_validator("market_loss_reaction")
    @classmethod
    def validate_reaction(cls, v: str) -> str:
        allowed = {"panic_sell", "hold", "buy_more"}
        if v not in allowed:
            raise ValueError(f"market_loss_reaction must be one of {allowed}")
        return v


class RiskProfileResponse(BaseModel):
    risk_level: str  # Low | Medium | High
    answers_echo: dict[str, Any]
    rationale: str
    score_breakdown: dict[str, int]
    disclaimer: str = (
        "This application is for educational purposes only and does not "
        "provide regulated financial or investment advice."
    )


# ─── Investment Plan ──────────────────────────────────────────────────────────

class ScenarioProjection(BaseModel):
    worst: float
    avg: float
    best: float


class InvestmentPlanRequest(BaseModel):
    risk_level: str = Field(description="Low | Medium | High")
    monthly_investment: float = Field(gt=0)

    @field_validator("risk_level")
    @classmethod
    def validate_risk(cls, v: str) -> str:
        if v not in {"Low", "Medium", "High"}:
            raise ValueError("risk_level must be Low, Medium, or High")
        return v


class InvestmentPlanResponse(BaseModel):
    risk_level: str
    allocation: dict[str, float]  # asset_category -> percentage
    projections: dict[str, ScenarioProjection]  # "1y", "3y", "5y"
    assumed_rates: dict[str, dict[str, float]]  # asset -> {worst, avg, best} annual rates
    total_invested: dict[str, float]  # capital invested at 1/3/5 years
    disclaimer: str = (
        "This application is for educational purposes only and does not "
        "provide regulated financial or investment advice."
    )


# ─── Dashboard ────────────────────────────────────────────────────────────────

class ActivityItem(BaseModel):
    timestamp: str
    event_type: str
    description: str


class DashboardResponse(BaseModel):
    user_id: int
    username: str
    latest_credit_score: int | None
    credit_score_label: str | None
    latest_risk_level: str | None
    latest_allocation: dict[str, float] | None
    health_score: float | None
    recent_activity: list[ActivityItem]
    suggestions: list[str]
    disclaimer: str = (
        "This application is for educational purposes only and does not "
        "provide regulated financial or investment advice."
    )


# ─── Sample Users ─────────────────────────────────────────────────────────────

class SampleUser(BaseModel):
    user_id: str
    recharge_frequency: float
    bill_payment_regularity: float
    upi_transaction_count: float
    wallet_usage_score: float
    monthly_savings_pct: float
    ecommerce_frequency: float
    bank_balance_stability: float
    monthly_income: float
    credit_score: int
    risk_profile: str
    recommended_allocation: str


class SampleUsersResponse(BaseModel):
    total: int
    page: int
    page_size: int
    users: list[SampleUser]
