"""
services/ml_service.py
──────────────────────
Loads the serialised Random Forest model, SHAP TreeExplainer, and scaler
from disk (once, at startup) and exposes functions for:
  - credit score prediction
  - per-request SHAP top-3 contributions
  - feature-based improvement suggestions
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

from app.core.config import get_settings
from app.schemas.credit import ShapContribution

logger = logging.getLogger(__name__)
settings = get_settings()

FEATURE_COLS = [
    "recharge_frequency",
    "bill_payment_regularity",
    "upi_transaction_count",
    "wallet_usage_score",
    "monthly_savings_pct",
    "ecommerce_frequency",
    "bank_balance_stability",
]

FEATURE_LABELS = {
    "recharge_frequency":      "Mobile Recharge Frequency",
    "bill_payment_regularity": "Utility Bill Payments",
    "upi_transaction_count":   "UPI Transaction Activity",
    "wallet_usage_score":      "Digital Wallet Usage",
    "monthly_savings_pct":     "Monthly Savings Rate",
    "ecommerce_frequency":     "E-commerce Activity",
    "bank_balance_stability":  "Bank Balance Stability",
}

IMPROVEMENT_TIPS = {
    "recharge_frequency": (
        "Increase your mobile recharge frequency. Even small, regular top-ups "
        "signal consistent digital engagement and improve your score."
    ),
    "bill_payment_regularity": (
        "Pay your utility bills on time every month. Set up auto-pay reminders to "
        "build a consistent payment history — this is one of the strongest signals."
    ),
    "upi_transaction_count": (
        "Use UPI for more daily transactions (groceries, transport, subscriptions). "
        "Regular digital payments demonstrate financial activity."
    ),
    "wallet_usage_score": (
        "Use your digital wallet more frequently. Regular top-ups and spends on "
        "apps like PhonePe, Paytm, or Google Pay improve this signal."
    ),
    "monthly_savings_pct": (
        "Try to save at least 10% of your monthly income. "
        "Even ₹500/month consistently demonstrates financial discipline."
    ),
    "ecommerce_frequency": (
        "Moderate, regular e-commerce activity signals digital financial engagement. "
        "Small, consistent purchases are more valuable than large sporadic ones."
    ),
    "bank_balance_stability": (
        "Avoid letting your bank balance drop to near-zero each month. "
        "Maintain a small buffer (ideally 1-2 months of expenses) to improve stability."
    ),
}

# Singleton holders
_model = None
_explainer = None
_scaler = None
_meta: Optional[dict] = None


def _resolve_path(path_str: str) -> Path:
    p = Path(path_str)
    if p.is_absolute() and p.exists():
        return p
    candidates = [
        p,
        Path.cwd() / p,
        Path.cwd().parent / p,
        Path(__file__).resolve().parents[2] / p,
        Path(__file__).resolve().parents[3] / p,
        Path("/app") / p,
    ]
    for c in candidates:
        if c.exists():
            return c
    return p


def _load_artifacts():
    global _model, _explainer, _scaler, _meta
    if _model is not None:
        return

    model_path = _resolve_path(settings.model_path)
    explainer_path = _resolve_path(settings.shap_explainer_path)
    scaler_path = _resolve_path(settings.scaler_path)
    meta_path = _resolve_path(settings.model_meta_path)

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found at {model_path}. "
            "Run `py ml/train_model.py` to generate it first."
        )

    logger.info(f"Loading ML model from {model_path}")
    _model = joblib.load(model_path)
    _explainer = joblib.load(explainer_path)
    if scaler_path.exists():
        _scaler = joblib.load(scaler_path)
    if meta_path.exists():
        with open(meta_path) as f:
            _meta = json.load(f)

    logger.info("ML artefacts loaded successfully.")


def predict_credit_score(features: dict) -> tuple[int, list[ShapContribution], list[str]]:
    """
    Returns:
        score       : int in [300, 900]
        shap_top3   : top 3 SHAP feature contributions
        suggestions : improvement tips for lowest-contributing features
    """
    _load_artifacts()

    X = np.array([[features[f] for f in FEATURE_COLS]])

    # Raw prediction (tree-based model, no scaling needed for RF)
    raw_score = float(_model.predict(X)[0])
    score = int(np.clip(round(raw_score), 300, 900))

    # ── SHAP values ──────────────────────────────────────────────────────────
    shap_vals = _explainer.shap_values(X)[0]  # shape: (n_features,)

    shap_pairs = sorted(
        zip(FEATURE_COLS, shap_vals),
        key=lambda x: abs(x[1]),
        reverse=True,
    )

    top3: list[ShapContribution] = []
    for feat, val in shap_pairs[:3]:
        top3.append(ShapContribution(
            feature=feat,
            contribution=round(float(val), 2),
            direction="positive" if val >= 0 else "negative",
            display_label=f"{FEATURE_LABELS[feat]} {'+' if val >= 0 else ''}{val:.0f}",
        ))

    # ── Suggestions: bottom-3 contributing features ───────────────────────────
    bottom_feats = [feat for feat, _ in shap_pairs[-3:]]
    suggestions = [IMPROVEMENT_TIPS[f] for f in bottom_feats]

    return score, top3, suggestions


def get_score_label(score: int) -> str:
    if score >= 750:
        return "Excellent"
    elif score >= 650:
        return "Good"
    elif score >= 550:
        return "Fair"
    elif score >= 450:
        return "Poor"
    return "Very Poor"


ENGLISH_EXPLANATIONS = {
    "recharge_frequency": {
        "helps": "High mobile recharge frequency ({val}/mo) demonstrates strong ongoing digital transaction activity (+{pts} pts).",
        "hurts": "Infrequent mobile recharges ({val}/mo) lowers your score (-{pts} pts) — top up more regularly.",
    },
    "bill_payment_regularity": {
        "helps": "Paying {val}% of utility bills on time shows exceptional payment discipline (+{pts} pts).",
        "hurts": "Utility bill regularity is at {val}% (-{pts} pts) — setting up bill reminders will boost your score.",
    },
    "upi_transaction_count": {
        "helps": "Active monthly UPI usage ({val} txns) signals high digital financial engagement (+{pts} pts).",
        "hurts": "Low UPI transaction volume ({val} txns) reduces score impact (-{pts} pts).",
    },
    "wallet_usage_score": {
        "helps": "Digital wallet usage score of {val}/100 supports your creditworthiness (+{pts} pts).",
        "hurts": "Digital wallet activity score is {val}/100 (-{pts} pts) — regular wallet transactions help.",
    },
    "monthly_savings_pct": {
        "helps": "Saving {val}% of monthly income builds strong financial safety (+{pts} pts).",
        "hurts": "Monthly savings rate of {val}% is low (-{pts} pts) — aim to save at least 10-15%.",
    },
    "ecommerce_frequency": {
        "helps": "Regular e-commerce purchase history ({val}/mo) demonstrates active digital spend (+{pts} pts).",
        "hurts": "Low e-commerce frequency ({val}/mo) provides limited shopping activity signal (-{pts} pts).",
    },
    "bank_balance_stability": {
        "helps": "High bank balance stability ({val}/100) indicates low liquidity risk (+{pts} pts).",
        "hurts": "Bank balance stability score of {val}/100 (-{pts} pts) — maintaining a balance cushion helps.",
    },
}


def explain_credit_score_detailed(user_id: int, features: dict) -> dict:
    """
    Computes full SHAP explanation breakdown for all 7 features.
    Returns dict formatted for ShapExplanationResponse.
    """
    _load_artifacts()

    X = np.array([[features[f] for f in FEATURE_COLS]])
    raw_score = float(_model.predict(X)[0])
    final_score = int(np.clip(round(raw_score), 300, 900))

    # Base value (SHAP expected value)
    try:
        expected_val = float(np.ravel(_explainer.expected_value)[0])
    except Exception:
        expected_val = 600.0

    shap_vals = _explainer.shap_values(X)[0]

    # Build detailed feature list
    detailed_features = []
    for feat, sv in zip(FEATURE_COLS, shap_vals):
        val = features[feat]
        direction = "helps" if sv >= 0 else "hurts"
        pts = abs(round(float(sv)))
        template = ENGLISH_EXPLANATIONS[feat][direction]
        explanation = template.format(val=val, pts=pts)

        detailed_features.append({
            "feature": feat,
            "feature_name": FEATURE_LABELS[feat],
            "user_value": float(val),
            "shap_value": round(float(sv), 2),
            "direction": direction,
            "impact_points": pts,
            "english_explanation": explanation,
        })

    # Sort by absolute SHAP impact descending
    detailed_features.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    # Top 2 positive/negative drivers for headline
    top1 = detailed_features[0]
    top2 = detailed_features[1]
    sign1 = "+" if top1["shap_value"] >= 0 else ""
    sign2 = "+" if top2["shap_value"] >= 0 else ""

    summary_headline = (
        f"Your score of {final_score} is mainly driven by {top1['feature_name']} "
        f"({sign1}{top1['shap_value']:.0f} pts) and {top2['feature_name']} "
        f"({sign2}{top2['shap_value']:.0f} pts)."
    )

    return {
        "user_id": user_id,
        "base_value": round(expected_val, 2),
        "final_score": final_score,
        "summary_headline": summary_headline,
        "features": detailed_features,
    }
