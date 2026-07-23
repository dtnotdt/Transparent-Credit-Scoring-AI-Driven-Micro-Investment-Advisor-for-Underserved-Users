"""
api/v1/credit.py  —  Credit score, risk profile, investment plan, dashboard, sample users, Financial Twin.
"""
import csv
import io
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_own_resource
from app.core.database import get_db
from app.models.assessment import CreditAssessment, RiskAssessment
from app.models.financial_twin import FinancialTwin
from app.models.user import User
from app.models.history import ActivityLog, ReportHistory
from app.models.investment import InvestmentPlan as InvestmentPlanModel
from app.schemas.credit import (
    ActivityItem,
    CreditScoreRequest,
    CreditScoreResponse,
    DashboardResponse,
    InvestmentPlanRequest,
    InvestmentPlanResponse,
    RiskProfileRequest,
    RiskProfileResponse,
    SampleUser,
    SampleUsersResponse,
    ShapExplanationResponse,
    CreditSimulationResponse,
    CoachRequest,
    CoachResponse,
)
from app.schemas.financial_twin import FinancialTwinRequest, FinancialTwinResponse, FinancialTwinProjection
from app.services.financial_twin_service import generate_financial_twin, get_latest_financial_twin
from app.services.investment_service import generate_investment_plan
from app.services.ml_service import get_score_label, predict_credit_score
from app.services.pdf_service import generate_pdf_report, generate_financial_twin_pdf
from app.services.risk_service import classify_risk

router = APIRouter(tags=["Credit & Investment"])

# Path candidate resolution for synthetic dataset sample-users endpoint
_SAMPLE_USERS: list[dict] | None = None

def _get_data_path() -> Path | None:
    candidates = [
        Path.cwd() / "database" / "synthetic_users.csv",
        Path(__file__).resolve().parents[3] / "database" / "synthetic_users.csv",
        Path(__file__).resolve().parents[4] / "database" / "synthetic_users.csv",
        Path("/app/database/synthetic_users.csv"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None

def _load_sample_users() -> list[dict]:
    global _SAMPLE_USERS
    if _SAMPLE_USERS is not None:
        return _SAMPLE_USERS
    data_path = _get_data_path()
    if not data_path:
        return []
    with open(data_path, newline="", encoding="utf-8") as f:
        _SAMPLE_USERS = list(csv.DictReader(f))
    return _SAMPLE_USERS



# ─── POST /credit-score ───────────────────────────────────────────────────────

@router.post("/credit-score", response_model=CreditScoreResponse)
def get_credit_score(
    req: CreditScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Compute credit score from alternative digital-behavior signals.
    Returns score (300-900), SHAP top-3 contributions, and improvement suggestions.
    """
    features = req.model_dump()
    try:
        score, shap_top3, suggestions = predict_credit_score(features)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # Persist
    assessment = CreditAssessment(
        user_id=current_user.id,
        **features,
        credit_score=score,
        shap_top3=[s.model_dump() for s in shap_top3],
        suggestions=suggestions,
    )
    db.add(assessment)
    
    activity = ActivityLog(
        user_id=current_user.id,
        event_type="credit_score_generated",
        description=f"Generated credit score: {score}"
    )
    db.add(activity)
    
    db.commit()

    return CreditScoreResponse(
        score=score,
        score_label=get_score_label(score),
        shap_top3=shap_top3,
        suggestions=suggestions,
    )


# ─── GET /explain/{user_id} (Feature 1) ───────────────────────────────────────

@router.get("/explain/{user_id}", response_model=ShapExplanationResponse)
def get_shap_explanation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns full SHAP waterfall explanation (Feature 1): base value, top features,
    positive/negative directions, plain-English summary, and per-feature descriptions.
    Caches latest assessment values from DB.
    """
    require_own_resource(user_id, current_user)

    latest = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == user_id)
        .order_by(CreditAssessment.created_at.desc())
        .first()
    )

    if not latest:
        # Fallback default features if user hasn't completed assessment yet
        features = {
            "recharge_frequency": 15,
            "bill_payment_regularity": 80.0,
            "upi_transaction_count": 75,
            "wallet_usage_score": 60.0,
            "monthly_savings_pct": 15.0,
            "ecommerce_frequency": 8,
            "bank_balance_stability": 65.0,
        }
    else:
        features = {
            "recharge_frequency": latest.recharge_frequency,
            "bill_payment_regularity": latest.bill_payment_regularity,
            "upi_transaction_count": latest.upi_transaction_count,
            "wallet_usage_score": latest.wallet_usage_score,
            "monthly_savings_pct": latest.monthly_savings_pct,
            "ecommerce_frequency": latest.ecommerce_frequency,
            "bank_balance_stability": latest.bank_balance_stability,
        }

    from app.services.ml_service import explain_credit_score_detailed
    explanation = explain_credit_score_detailed(user_id, features)
    return ShapExplanationResponse(**explanation)


# ─── POST /simulate (Feature 2) ───────────────────────────────────────────────

@router.post("/simulate", response_model=CreditSimulationResponse)
def simulate_credit_score(
    req: CreditScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates what-if score simulation (Feature 2) using modified feature vector.
    Compares against user's latest actual score and generates custom delta report.
    """
    # 1. Fetch latest actual score
    latest = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == current_user.id)
        .order_by(CreditAssessment.created_at.desc())
        .first()
    )

    old_score = latest.credit_score if latest else 600

    # 2. Run simulation
    features = req.model_dump()
    try:
        from app.services.ml_service import predict_credit_score
        new_score, shap_top3, _ = predict_credit_score(features)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    delta = new_score - old_score

    # 3. Generate plain-English explanation narrative based on top impact changes
    # Find which feature shifted the most compared to latest baseline (if baseline exists)
    if latest:
        diffs = {
            "bill_payment_regularity": features["bill_payment_regularity"] - latest.bill_payment_regularity,
            "recharge_frequency": features["recharge_frequency"] - latest.recharge_frequency,
            "upi_transaction_count": features["upi_transaction_count"] - latest.upi_transaction_count,
            "wallet_usage_score": features["wallet_usage_score"] - latest.wallet_usage_score,
            "monthly_savings_pct": features["monthly_savings_pct"] - latest.monthly_savings_pct,
            "ecommerce_frequency": features["ecommerce_frequency"] - latest.ecommerce_frequency,
            "bank_balance_stability": features["bank_balance_stability"] - latest.bank_balance_stability,
        }
        max_diff_feat = max(diffs, key=lambda k: abs(diffs[k]))
        val_diff = diffs[max_diff_feat]
        feat_display = max_diff_feat.replace("_", " ").title()
    else:
        max_diff_feat = "bill_payment_regularity"
        val_diff = 10
        feat_display = "Bill Payment Regularity"

    sign = "+" if delta >= 0 else ""
    if abs(delta) < 5:
        explanation = f"Adjusting variables resulted in no significant score change (simulated {new_score} vs original {old_score}). Keep scaling payments to raise your score."
    elif delta > 0:
        explanation = f"By increasing {feat_display} (change of {val_diff:+.0f}), your simulated credit score rises to {new_score} ({sign}{delta} points impact). Continuing this trend can permanently boost your score."
    else:
        explanation = f"Reducing {feat_display} (change of {val_diff:+.0f}) triggers a simulated score drop of {abs(delta)} points (down to {new_score}). Maintaining stable balances helps prevent score drops."

    return CreditSimulationResponse(
        old_score=old_score,
        new_score=new_score,
        delta=delta,
        explanation=explanation,
    )


# ─── POST /coach (Feature 3) ──────────────────────────────────────────────────

@router.post("/coach", response_model=CoachResponse)
def get_ai_coach_advice(
    req: CoachRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Returns AI financial coach recommendations (Feature 3) based on credit score,
    SHAP contributions, and savings rate. Supports follow-up messaging.
    """
    from app.services.coach_service import get_coach_advice
    result = get_coach_advice(
        credit_score=req.credit_score,
        shap_factors=req.shap_factors,
        monthly_savings_pct=req.monthly_savings_pct,
        monthly_income=req.monthly_income,
        risk_level=req.risk_level,
        language=req.language,
        messages=req.messages,
    )
    return CoachResponse(**result)



# ─── POST /risk-profile ───────────────────────────────────────────────────────

@router.post("/risk-profile", response_model=RiskProfileResponse)
def get_risk_profile(
    req: RiskProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Classify investment risk tolerance using an explicit, inspectable rule system.
    Returns Low / Medium / High with full score breakdown and rationale.
    """
    result = classify_risk(req)

    assessment = RiskAssessment(
        user_id=current_user.id,
        answers=req.model_dump(),
        risk_level=result.risk_level,
        rationale=result.rationale,
        score_breakdown=result.score_breakdown,
    )
    db.add(assessment)
    
    activity = ActivityLog(
        user_id=current_user.id,
        event_type="risk_profile_generated",
        description=f"Generated risk profile: {result.risk_level}"
    )
    db.add(activity)
    
    db.commit()

    return result


# ─── POST /investment-plan ────────────────────────────────────────────────────

@router.post("/investment-plan", response_model=InvestmentPlanResponse)
def get_investment_plan(
    req: InvestmentPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate SIP-based investment allocation and 1/3/5-year growth projections
    (worst / average / best scenarios) for the given risk profile.
    """
    plan_response = generate_investment_plan(req)
    
    plan_model = InvestmentPlanModel(
        user_id=current_user.id,
        risk_level=plan_response.risk_level,
        monthly_investment=req.monthly_investment,
        allocation=plan_response.allocation,
        projections={k: v.model_dump() for k, v in plan_response.projections.items()}
    )
    db.add(plan_model)
    
    activity = ActivityLog(
        user_id=current_user.id,
        event_type="investment_plan_generated",
        description="Generated investment plan."
    )
    db.add(activity)
    db.commit()
    
    return plan_response


# ─── GET /dashboard/{user_id} ────────────────────────────────────────────────

@router.get("/dashboard/{user_id}", response_model=DashboardResponse)
def get_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregated view: latest credit score, risk profile, allocation, activity feed."""
    require_own_resource(user_id, current_user)

    # Latest credit assessment
    latest_credit = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == user_id)
        .order_by(CreditAssessment.created_at.desc())
        .first()
    )

    # Latest risk assessment
    latest_risk = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.user_id == user_id)
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )

    # Build activity feed (last 10 events)
    activity: list[ActivityItem] = []
    credit_events = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == user_id)
        .order_by(CreditAssessment.created_at.desc())
        .limit(5)
        .all()
    )
    risk_events = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.user_id == user_id)
        .order_by(RiskAssessment.created_at.desc())
        .limit(5)
        .all()
    )

    for ca in credit_events:
        activity.append(ActivityItem(
            timestamp=ca.created_at.isoformat(),
            event_type="credit_score",
            description=f"Credit score assessed: {ca.credit_score} ({get_score_label(ca.credit_score)})",
        ))
    for ra in risk_events:
        activity.append(ActivityItem(
            timestamp=ra.created_at.isoformat(),
            event_type="risk_profile",
            description=f"Risk profile assessed: {ra.risk_level}",
        ))

    activity.sort(key=lambda x: x.timestamp, reverse=True)
    activity = activity[:10]

    # Health score composite: blend of credit score (normalised) + risk engagement
    health_score = None
    if latest_credit:
        norm = (latest_credit.credit_score - 300) / (900 - 300)  # 0-1
        engagement_bonus = 5 if latest_risk else 0
        health_score = round(norm * 90 + engagement_bonus, 1)

    # Latest allocation
    latest_allocation = None
    if latest_risk:
        from app.services.investment_service import ALLOCATIONS
        latest_allocation = ALLOCATIONS.get(latest_risk.risk_level)

    return DashboardResponse(
        user_id=user_id,
        username=current_user.username,
        latest_credit_score=latest_credit.credit_score if latest_credit else None,
        credit_score_label=get_score_label(latest_credit.credit_score) if latest_credit else None,
        latest_risk_level=latest_risk.risk_level if latest_risk else None,
        latest_allocation=latest_allocation,
        health_score=health_score,
        recent_activity=activity,
        suggestions=latest_credit.suggestions if latest_credit else [],
    )


# ─── GET /sample-users ────────────────────────────────────────────────────────

@router.get("/sample-users", response_model=SampleUsersResponse)
def get_sample_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Paginated list of synthetic users for demo/testing. No auth required."""
    users = _load_sample_users()
    total = len(users)
    start = (page - 1) * page_size
    end = start + page_size
    page_users = users[start:end]

    return SampleUsersResponse(
        total=total,
        page=page,
        page_size=page_size,
        users=[
            SampleUser(
                user_id=u["user_id"],
                recharge_frequency=float(u["recharge_frequency"]),
                bill_payment_regularity=float(u["bill_payment_regularity"]),
                upi_transaction_count=float(u["upi_transaction_count"]),
                wallet_usage_score=float(u["wallet_usage_score"]),
                monthly_savings_pct=float(u["monthly_savings_pct"]),
                ecommerce_frequency=float(u["ecommerce_frequency"]),
                bank_balance_stability=float(u["bank_balance_stability"]),
                monthly_income=float(u["monthly_income"]),
                credit_score=int(u["credit_score"]),
                risk_profile=u["risk_profile"],
                recommended_allocation=u["recommended_allocation"],
            )
            for u in page_users
        ],
    )


# ─── GET /export-csv/{user_id} ────────────────────────────────────────────────

@router.get("/export-csv/{user_id}")
def export_user_csv(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all credit assessments for the current user as a CSV file."""
    require_own_resource(user_id, current_user)

    assessments = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == user_id)
        .order_by(CreditAssessment.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date", "credit_score", "score_label",
        "recharge_frequency", "bill_payment_regularity", "upi_transaction_count",
        "wallet_usage_score", "monthly_savings_pct", "ecommerce_frequency", "bank_balance_stability",
    ])
    for a in assessments:
        writer.writerow([
            a.created_at.date(), a.credit_score, get_score_label(a.credit_score),
            a.recharge_frequency, a.bill_payment_regularity, a.upi_transaction_count,
            a.wallet_usage_score, a.monthly_savings_pct, a.ecommerce_frequency, a.bank_balance_stability,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=credit_history_user_{user_id}.csv"},
    )


# ─── POST /report-pdf ─────────────────────────────────────────────────────────

@router.post("/report-pdf")
def generate_report_pdf(
    credit_req: CreditScoreRequest,
    risk_req: RiskProfileRequest,
    investment_amount: float = Query(gt=0, default=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and download a PDF report combining credit score + risk + investment plan."""
    features = credit_req.model_dump()
    try:
        score, shap_top3, suggestions = predict_credit_score(features)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    risk_result = classify_risk(risk_req)

    from app.schemas.credit import InvestmentPlanRequest as IPReq
    inv_req = IPReq(risk_level=risk_result.risk_level, monthly_investment=investment_amount)
    inv_plan = generate_investment_plan(inv_req)

    pdf_bytes = generate_pdf_report(
        username=current_user.username,
        credit_score=score,
        score_label=get_score_label(score),
        shap_top3=[s.model_dump() for s in shap_top3],
        suggestions=suggestions,
        risk_level=risk_result.risk_level,
        allocation=inv_plan.allocation,
        projections={k: v.model_dump() for k, v in inv_plan.projections.items()},
        monthly_investment=investment_amount,
        coach_tips=None,
    )

    report_history = ReportHistory(
        user_id=current_user.id,
        report_type="credit_report"
    )
    db.add(report_history)
    
    activity = ActivityLog(
        user_id=current_user.id,
        event_type="report_generated",
        description="Generated comprehensive credit report."
    )
    db.add(activity)
    db.commit()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=credit_report_{current_user.username}.pdf"},
    )


# ─── GET /report/{user_id}/pdf  (Feature 4) ───────────────────────────────────

@router.get("/report/{user_id}/pdf")
def download_report_pdf(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Feature 4 — One-click PDF download using *stored* assessment data.
    No form re-submission required. Includes credit score, SHAP top-3,
    AI coach tips, risk profile, and investment allocation.
    Falls back gracefully if only partial data exists.
    """
    require_own_resource(user_id, current_user)

    # ── 1. Fetch latest stored credit assessment ──────────────────────────────
    latest_credit = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == user_id)
        .order_by(CreditAssessment.created_at.desc())
        .first()
    )
    if not latest_credit:
        raise HTTPException(
            status_code=404,
            detail="No credit assessment found. Please complete the Credit Score assessment first.",
        )

    # ── 2. Fetch latest stored risk assessment ────────────────────────────────
    latest_risk = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.user_id == user_id)
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )

    risk_level = latest_risk.risk_level if latest_risk else "Medium"
    monthly_investment = 5000.0

    # ── 3. Investment plan from stored risk level ─────────────────────────────
    from app.schemas.credit import InvestmentPlanRequest as IPReq
    inv_req = IPReq(risk_level=risk_level, monthly_investment=monthly_investment)
    inv_plan = generate_investment_plan(inv_req)

    shap_top3_raw = latest_credit.shap_top3 or []
    coach_tips: list[str] = []
    try:
        from app.services.coach_service import get_coach_advice
        coach_result = get_coach_advice(
            credit_score=latest_credit.credit_score,
            shap_factors=shap_top3_raw,
            monthly_savings_pct=latest_credit.monthly_savings_pct,
            monthly_income=30000.0,  # safe default; no income stored
            risk_level=risk_level,
            messages=None,
        )
        coach_tips = [
            f"{rec['title']}: {rec['detail']}"
            for rec in coach_result.get("recommendations", [])
        ]
    except Exception:
        coach_tips = []

    # ── 5. Generate PDF ───────────────────────────────────────────────────────
    pdf_bytes = generate_pdf_report(
        username=current_user.username,
        credit_score=latest_credit.credit_score,
        score_label=get_score_label(latest_credit.credit_score),
        shap_top3=shap_top3_raw,
        suggestions=latest_credit.suggestions or [],
        risk_level=risk_level,
        allocation=inv_plan.allocation,
        projections={k: v.model_dump() for k, v in inv_plan.projections.items()},
        monthly_investment=monthly_investment,
        coach_tips=coach_tips,
    )

    # ── 6. Save PDF to disk and record in report_history ─────────────────────
    from app.core.config import get_settings
    settings = get_settings()
    reports_dir = Path(settings.reports_dir) / str(user_id)
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_filename = f"credit_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.pdf"
    report_path = reports_dir / report_filename
    report_path.write_bytes(pdf_bytes)

    report_record = ReportHistory(
        user_id=user_id,
        report_name=f"Credit Report — {datetime.now(timezone.utc).strftime('%d %b %Y %H:%M')}",
        report_type="credit_report",
        pdf_path=str(report_path),
        download_count=1,
    )
    db.add(report_record)

    activity = ActivityLog(
        user_id=user_id,
        event_type="report_downloaded",
        description="Downloaded credit report PDF."
    )
    db.add(activity)
    db.commit()

    safe_username = "".join(c for c in current_user.username if c.isalnum() or c in "_-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=vantage_report_{safe_username}.pdf",
            "Cache-Control": "no-cache",
        },
    )


# ─── POST /financial-twin ─────────────────────────────────────────────────────

@router.post("/financial-twin", response_model=FinancialTwinResponse, tags=["Financial Twin"])
def create_financial_twin(
    req: Optional[FinancialTwinRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate and store a Financial Twin for the authenticated user.
    Uses the user's latest Credit Assessment and Risk Assessment from the database.
    Returns 1-year, 3-year, and 5-year projections with AI coach summary.

    ⚠️ For educational purposes only. Not financial advice.
    """
    if req is None:
        req = FinancialTwinRequest()

    result = generate_financial_twin(
        user=current_user,
        db=db,
        monthly_income_override=req.monthly_income,
        monthly_savings_override=req.monthly_savings,
        monthly_investment_override=req.monthly_investment,
    )
    
    activity = ActivityLog(
        user_id=current_user.id,
        event_type="financial_twin_generated",
        description="Generated financial twin projection."
    )
    db.add(activity)
    db.commit()
    
    return result


# ─── GET /financial-twin/{user_id} ───────────────────────────────────────────

@router.get("/financial-twin/{user_id}", response_model=FinancialTwinResponse, tags=["Financial Twin"])
def get_financial_twin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve the latest stored Financial Twin for a user.
    Users can only access their own twin. Admins can access any.
    Returns HTTP 403 for unauthorized access.
    """
    require_own_resource(user_id, current_user)

    twin = get_latest_financial_twin(user_id, db)
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Financial Twin found. Generate one first via POST /financial-twin.",
        )

    return FinancialTwinResponse(
        twin_id=twin.id,
        user_id=twin.user_id,
        generated_at=twin.created_at.isoformat(),
        current_credit_score=twin.current_credit_score,
        current_savings_monthly=twin.current_savings_monthly,
        current_investment_monthly=twin.current_investment_monthly,
        current_risk_level=twin.current_risk_level,
        projection_1y=FinancialTwinProjection(**twin.projections_1y),
        projection_3y=FinancialTwinProjection(**twin.projections_3y),
        projection_5y=FinancialTwinProjection(**twin.projections_5y),
        coach_summary=twin.coach_summary,
    )


# ─── GET /financial-twin/{user_id}/pdf ───────────────────────────────────────

@router.get("/financial-twin/{user_id}/pdf", tags=["Financial Twin"])
def download_financial_twin_pdf(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download the latest Financial Twin as a PDF report.
    Users can only download their own report (HTTP 403 for others).
    """
    require_own_resource(user_id, current_user)

    twin = get_latest_financial_twin(user_id, db)
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Financial Twin found. Generate one first via POST /financial-twin.",
        )

    pdf_bytes = generate_financial_twin_pdf(
        username=current_user.username,
        twin=twin,
    )

    # Save to disk
    from app.core.config import get_settings
    settings = get_settings()
    reports_dir = Path(settings.reports_dir) / str(user_id)
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_filename = f"financial_twin_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.pdf"
    report_path = reports_dir / report_filename
    report_path.write_bytes(pdf_bytes)

    report_record = ReportHistory(
        user_id=user_id,
        report_name=f"Financial Twin Report — {datetime.now(timezone.utc).strftime('%d %b %Y %H:%M')}",
        report_type="financial_twin_report",
        pdf_path=str(report_path),
        download_count=1,
    )
    db.add(report_record)

    activity = ActivityLog(
        user_id=user_id,
        event_type="financial_twin_downloaded",
        description="Downloaded financial twin report PDF."
    )
    db.add(activity)
    db.commit()

    safe_username = "".join(c for c in current_user.username if c.isalnum() or c in "_-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=financial_twin_{safe_username}.pdf",
            "Cache-Control": "no-cache",
        },
    )


# ─── GET /reports/history/{user_id} ──────────────────────────────────────────

@router.get("/reports/history/{user_id}")
def get_report_history(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all generated reports for a user. Ownership enforced — 403 on cross-user access."""
    require_own_resource(user_id, current_user)

    reports = (
        db.query(ReportHistory)
        .filter(ReportHistory.user_id == user_id)
        .order_by(ReportHistory.generated_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "report_name": r.report_name,
            "report_type": r.report_type,
            "generated_at": r.generated_at.isoformat(),
            "download_count": r.download_count,
        }
        for r in reports
    ]


# ─── GET /reports/download/{report_id} ───────────────────────────────────────

@router.get("/reports/download/{report_id}")
def download_stored_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a previously generated report by ID. Increments download_count. 403 on cross-user."""
    report = db.query(ReportHistory).filter(ReportHistory.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_own_resource(report.user_id, current_user)

    if not report.pdf_path or not Path(report.pdf_path).exists():
        raise HTTPException(status_code=404, detail="PDF file not found on server. It may have been deleted.")

    report.download_count += 1
    db.commit()

    pdf_bytes = Path(report.pdf_path).read_bytes()
    safe_name = report.report_name.replace(" ", "_").replace("—", "-")[:60]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={safe_name}.pdf", "Cache-Control": "no-cache"},
    )


# ─── DELETE /reports/{report_id} ─────────────────────────────────────────────

@router.delete("/reports/{report_id}", status_code=204)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a report row and its underlying PDF file. 403 on cross-user access."""
    report = db.query(ReportHistory).filter(ReportHistory.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    require_own_resource(report.user_id, current_user)

    # Remove file from disk
    if report.pdf_path:
        try:
            Path(report.pdf_path).unlink(missing_ok=True)
        except Exception:
            pass

    db.delete(report)
    db.commit()
