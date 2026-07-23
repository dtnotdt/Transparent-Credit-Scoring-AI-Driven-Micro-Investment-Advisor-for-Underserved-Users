"""
api/v1/admin.py  —  Admin analytics and user management (Feature 5 + RBAC).

RBAC: All endpoints require role == "ADMIN".
     Non-admin users receive HTTP 403 Forbidden.
     Admins NEVER see plain-text passwords — only metadata is returned.

Endpoints:
  GET /admin/analytics     — Platform-wide aggregated statistics
  GET /admin/users         — List all users (with search & filter)
  GET /admin/users/{id}    — View individual user profile (no password exposed)
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.assessment import CreditAssessment, RiskAssessment
from app.models.financial_twin import FinancialTwin
from app.models.user import User
from app.models.investment import InvestmentPlan
from app.models.history import ActivityLog, ReportHistory
from app.services.ml_service import get_score_label

router = APIRouter(prefix="/admin", tags=["Admin Analytics"])


# ── GET /admin/analytics ──────────────────────────────────────────────────────

@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Feature 5 — Admin Analytics Dashboard.
    Requires role == ADMIN. Returns HTTP 403 for non-admin users.
    Returns aggregated platform statistics: score distribution, risk breakdown,
    recent global activity, Financial Twin count, and platform health metrics.
    """

    # ── 1. Basic counts ───────────────────────────────────────────────────────
    total_users = db.query(User).count()
    total_credit_assessments = db.query(CreditAssessment).count()
    total_risk_assessments = db.query(RiskAssessment).count()
    total_financial_twins = db.query(FinancialTwin).count()
    total_investment_plans = db.query(InvestmentPlan).count()

    # ── 2. Role breakdown ─────────────────────────────────────────────────────
    admin_count = db.query(User).filter(User.role == "ADMIN").count()
    user_count = db.query(User).filter(User.role == "USER").count()

    # ── 3. All credit scores ──────────────────────────────────────────────────
    all_scores = [
        row.credit_score
        for row in db.query(CreditAssessment.credit_score).all()
    ]

    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

    # Score distribution buckets
    buckets = {
        "Very Poor (300-499)": 0,
        "Poor (500-599)": 0,
        "Fair (600-699)": 0,
        "Good (700-799)": 0,
        "Excellent (800-900)": 0,
    }
    for s in all_scores:
        if s < 500:
            buckets["Very Poor (300-499)"] += 1
        elif s < 600:
            buckets["Poor (500-599)"] += 1
        elif s < 700:
            buckets["Fair (600-699)"] += 1
        elif s < 800:
            buckets["Good (700-799)"] += 1
        else:
            buckets["Excellent (800-900)"] += 1

    total_scored = len(all_scores) or 1
    score_distribution = [
        {"label": label, "count": count, "pct": round(count / total_scored * 100, 1)}
        for label, count in buckets.items()
    ]

    # ── 4. Risk breakdown ─────────────────────────────────────────────────────
    all_risks = [
        row.risk_level
        for row in db.query(RiskAssessment.risk_level).all()
    ]
    risk_counts = Counter(all_risks)
    total_risked = len(all_risks) or 1
    risk_breakdown = [
        {
            "level": level,
            "count": risk_counts.get(level, 0),
            "pct": round(risk_counts.get(level, 0) / total_risked * 100, 1),
        }
        for level in ["Low", "Medium", "High"]
    ]

    # ── 5. Platform health index ──────────────────────────────────────────────
    user_ids_with_credit = set(
        row.user_id for row in db.query(CreditAssessment.user_id).distinct()
    )
    user_ids_with_risk = set(
        row.user_id for row in db.query(RiskAssessment.user_id).distinct()
    )

    platform_health = None
    if avg_score:
        norm = (avg_score - 300) / (900 - 300)
        engagement_bonus = 5 if len(user_ids_with_risk) > 0 else 0
        platform_health = round(norm * 90 + engagement_bonus, 1)

    # ── 6. Recent global activity (last 15 events across all users) ───────────
    recent_activities = (
        db.query(ActivityLog, User.username)
        .join(User, ActivityLog.user_id == User.id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(15)
        .all()
    )

    activity = []
    for log, uname in recent_activities:
        activity.append({
            "timestamp": log.timestamp.isoformat(),
            "user": uname,
            "event_type": log.event_type,
            "description": f"{uname}: {log.description}",
            "score": None, # Kept for frontend compatibility
        })

    # ── 7. Engagement metrics ─────────────────────────────────────────────────
    fully_engaged = len(user_ids_with_credit & user_ids_with_risk)
    engagement_rate = round(fully_engaged / max(total_users, 1) * 100, 1)

    return {
        "summary": {
            "total_users": total_users,
            "total_admins": admin_count,
            "total_regular_users": user_count,
            "total_credit_assessments": total_credit_assessments,
            "total_risk_assessments": total_risk_assessments,
            "total_financial_twins": total_financial_twins,
            "total_investment_plans": total_investment_plans,
            "avg_credit_score": avg_score,
            "platform_health_index": platform_health,
            "fully_engaged_users": fully_engaged,
            "engagement_rate_pct": engagement_rate,
        },
        "score_distribution": score_distribution,
        "risk_breakdown": risk_breakdown,
        "recent_activity": activity,
        "disclaimer": (
            "This application is for educational purposes only and does not "
            "provide regulated financial or investment advice."
        ),
    }


# ── GET /admin/users ──────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    search: Optional[str] = Query(default=None, description="Search by username or email"),
    role: Optional[str] = Query(default=None, description="Filter by role: USER | ADMIN"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    List all registered users with search and filter.
    Requires ADMIN role. Returns HTTP 403 for non-admins.
    Passwords are NEVER returned — only metadata.
    """
    query = db.query(User)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (User.username.ilike(search_term)) | (User.email.ilike(search_term))
        )

    if role:
        if role.upper() not in ("USER", "ADMIN"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="role must be 'USER' or 'ADMIN'",
            )
        query = query.filter(User.role == role.upper())

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Get assessment counts per user for analytics
    credit_counts = {
        row.user_id: row.count
        for row in db.query(CreditAssessment.user_id, db.query(CreditAssessment).filter(
            CreditAssessment.user_id == CreditAssessment.user_id
        ).count().label("count")).all()
    } if False else {}  # Simplified: compute per-user below

    # Get latest credit score per user
    latest_scores = {}
    for u in users:
        latest = (
            db.query(CreditAssessment)
            .filter(CreditAssessment.user_id == u.id)
            .order_by(CreditAssessment.created_at.desc())
            .first()
        )
        latest_scores[u.id] = latest.credit_score if latest else None

    latest_risk = {}
    for u in users:
        latest = (
            db.query(RiskAssessment)
            .filter(RiskAssessment.user_id == u.id)
            .order_by(RiskAssessment.created_at.desc())
            .first()
        )
        latest_risk[u.id] = latest.risk_level if latest else None

    twin_exists = {}
    for u in users:
        twin = (
            db.query(FinancialTwin)
            .filter(FinancialTwin.user_id == u.id)
            .first()
        )
        twin_exists[u.id] = twin is not None

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
                "latest_credit_score": latest_scores.get(u.id),
                "latest_risk_level": latest_risk.get(u.id),
                "has_financial_twin": twin_exists.get(u.id, False),
                # NOTE: hashed_password is NEVER included
            }
            for u in users
        ],
    }


# ── GET /admin/users/{user_id} ────────────────────────────────────────────────

@router.get("/users/{user_id}")
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Get detailed profile for any user (admin only).
    Passwords are NEVER returned — always bcrypt-hashed and never exposed.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    credit_count = db.query(CreditAssessment).filter(CreditAssessment.user_id == user_id).count()
    risk_count = db.query(RiskAssessment).filter(RiskAssessment.user_id == user_id).count()
    twin_count = db.query(FinancialTwin).filter(FinancialTwin.user_id == user_id).count()

    latest_credit = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.user_id == user_id)
        .order_by(CreditAssessment.created_at.desc())
        .first()
    )
    latest_risk = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.user_id == user_id)
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
        # Password is intentionally NOT included — always bcrypt hashed, never plain-text
        "assessments": {
            "credit_count": credit_count,
            "risk_count": risk_count,
            "financial_twin_count": twin_count,
            "latest_credit_score": latest_credit.credit_score if latest_credit else None,
            "latest_risk_level": latest_risk.risk_level if latest_risk else None,
        },
    }


# ── GET /admin/export-users-csv ───────────────────────────────────────────────

@router.get("/export-users-csv")
def export_users_csv(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Export all user analytics as CSV (admin only).
    Passwords are NEVER included in the export.
    """
    import csv
    import io
    from fastapi.responses import StreamingResponse

    users = db.query(User).order_by(User.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "username", "email", "role", "is_active", "created_at",
        "credit_assessments", "risk_assessments", "latest_credit_score", "latest_risk_level",
    ])
    for u in users:
        credit_count = db.query(CreditAssessment).filter(CreditAssessment.user_id == u.id).count()
        risk_count = db.query(RiskAssessment).filter(RiskAssessment.user_id == u.id).count()
        latest_credit = (
            db.query(CreditAssessment)
            .filter(CreditAssessment.user_id == u.id)
            .order_by(CreditAssessment.created_at.desc())
            .first()
        )
        latest_risk = (
            db.query(RiskAssessment)
            .filter(RiskAssessment.user_id == u.id)
            .order_by(RiskAssessment.created_at.desc())
            .first()
        )
        writer.writerow([
            u.id, u.username, u.email, u.role, u.is_active,
            u.created_at.date(),
            credit_count, risk_count,
            latest_credit.credit_score if latest_credit else "",
            latest_risk.risk_level if latest_risk else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vantage_users_analytics.csv"},
    )


# ── GET /admin/reports ────────────────────────────────────────────────────

@router.get("/reports")
def get_all_reports(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Admin-only: list all generated reports across all users.
    Returns user attribution, report name, type, date, and download count.
    """
    reports = (
        db.query(ReportHistory, User.username)
        .join(User, ReportHistory.user_id == User.id)
        .order_by(ReportHistory.generated_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "username": uname,
            "report_name": r.report_name,
            "report_type": r.report_type,
            "generated_at": r.generated_at.isoformat(),
            "download_count": r.download_count,
        }
        for r, uname in reports
    ]
