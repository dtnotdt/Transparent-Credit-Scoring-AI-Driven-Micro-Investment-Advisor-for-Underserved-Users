"""
train_model.py
──────────────
Trains a Random Forest Regressor for credit score prediction,
compares against Logistic Regression baseline, computes SHAP values,
and serialises all artefacts to ml/models/.

Outputs
───────
  ml/models/credit_model.joblib     – winning RF regressor
  ml/models/shap_explainer.joblib   – SHAP TreeExplainer
  ml/models/scaler.joblib           – StandardScaler for feature preprocessing
  docs/model_metrics.md             – human-readable metrics report
"""

import os
import sys
import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
import shap
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "database" / "synthetic_users.csv"
MODELS_DIR = ROOT / "ml" / "models"
DOCS_DIR = ROOT / "docs"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
DOCS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
    "recharge_frequency",
    "bill_payment_regularity",
    "upi_transaction_count",
    "wallet_usage_score",
    "monthly_savings_pct",
    "ecommerce_frequency",
    "bank_balance_stability",
]
TARGET_COL = "credit_score"


def load_data():
    if not DATA_PATH.exists():
        print("⚠️  Dataset not found. Running generate_dataset.py first...")
        import subprocess
        subprocess.run([sys.executable, str(ROOT / "ml" / "generate_dataset.py")], check=True)
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} rows from {DATA_PATH}")
    return df


def train(df: pd.DataFrame):
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # ── Scaling (stored for inference) ────────────────────────────────────────
    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc = scaler.transform(X_test)

    # ── Baseline: Ridge Regression ────────────────────────────────────────────
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train_sc, y_train)
    ridge_preds = ridge.predict(X_test_sc)
    ridge_mae = mean_absolute_error(y_test, ridge_preds)
    ridge_r2 = r2_score(y_test, ridge_preds)
    ridge_rmse = np.sqrt(mean_squared_error(y_test, ridge_preds))
    print(f"\n[Baseline – Ridge]  MAE={ridge_mae:.2f}  RMSE={ridge_rmse:.2f}  R²={ridge_r2:.4f}")

    # ── Random Forest Regressor ───────────────────────────────────────────────
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        n_jobs=-1,
        random_state=42,
    )
    rf.fit(X_train, y_train)  # RF on raw features (tree-based = no scaling needed)
    rf_preds = rf.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_r2 = r2_score(y_test, rf_preds)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_preds))

    # Cross-validation
    cv_scores = cross_val_score(rf, X, y, cv=5, scoring="r2")
    print(f"[RF Regressor]      MAE={rf_mae:.2f}  RMSE={rf_rmse:.2f}  R²={rf_r2:.4f}")
    print(f"  5-fold CV R²: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Feature importances ───────────────────────────────────────────────────
    importances = dict(zip(FEATURE_COLS, rf.feature_importances_.round(4)))
    print("\nFeature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
        bar = "#" * int(imp * 50)
        print(f"  {feat:<30} {imp:.4f}  {bar}")

    # ── SHAP TreeExplainer ────────────────────────────────────────────────────
    print("\nFitting SHAP TreeExplainer (this may take a moment)...")
    explainer = shap.TreeExplainer(rf)
    # Compute SHAP on a subsample (200 rows) to keep the artefact lean
    X_shap = X_test[:200]
    shap_values = explainer.shap_values(X_shap)
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    shap_importance = dict(zip(FEATURE_COLS, mean_abs_shap.round(4)))
    print("Mean |SHAP| per feature:")
    for feat, sv in sorted(shap_importance.items(), key=lambda x: -x[1]):
        print(f"  {feat:<30} {sv:.4f}")

    # ── Serialise ─────────────────────────────────────────────────────────────
    joblib.dump(rf, MODELS_DIR / "credit_model.joblib")
    joblib.dump(explainer, MODELS_DIR / "shap_explainer.joblib")
    joblib.dump(scaler, MODELS_DIR / "scaler.joblib")
    # Store feature metadata for inference layer
    meta = {
        "feature_cols": FEATURE_COLS,
        "target_col": TARGET_COL,
        "score_range": [300, 900],
        "model_type": "RandomForestRegressor",
        "baseline_type": "Ridge",
        "rf_metrics": {"mae": round(rf_mae, 2), "rmse": round(rf_rmse, 2), "r2": round(rf_r2, 4)},
        "ridge_metrics": {"mae": round(ridge_mae, 2), "rmse": round(ridge_rmse, 2), "r2": round(ridge_r2, 4)},
        "cv_r2_mean": round(float(cv_scores.mean()), 4),
        "cv_r2_std": round(float(cv_scores.std()), 4),
        "feature_importances": importances,
        "shap_importance": shap_importance,
    }
    with open(MODELS_DIR / "model_meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n[OK] Artefacts saved to {MODELS_DIR}")

    # ── docs/model_metrics.md ─────────────────────────────────────────────────
    md_lines = [
        "# Model Metrics Report",
        "",
        "Generated automatically by `ml/train_model.py`.",
        "",
        "## Dataset",
        f"- Rows: {len(df)}",
        f"- Features: {', '.join(FEATURE_COLS)}",
        f"- Target: `{TARGET_COL}` (range 300–900)",
        f"- Train/Test split: 80 / 20",
        "",
        "## Model Comparison",
        "",
        "| Metric | Ridge (Baseline) | Random Forest (Winner) |",
        "|--------|-----------------|------------------------|",
        f"| MAE    | {ridge_mae:.2f} | **{rf_mae:.2f}** |",
        f"| RMSE   | {ridge_rmse:.2f} | **{rf_rmse:.2f}** |",
        f"| R²     | {ridge_r2:.4f} | **{rf_r2:.4f}** |",
        "",
        f"5-fold CV R² (RF): **{cv_scores.mean():.4f} ± {cv_scores.std():.4f}**",
        "",
        "## Feature Importances (RF)",
        "",
        "| Feature | Importance |",
        "|---------|------------|",
    ]
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
        md_lines.append(f"| {feat} | {imp:.4f} |")

    md_lines += [
        "",
        "## SHAP Mean |value|",
        "",
        "| Feature | Mean |SHAP| |",
        "|---------|-------------|",
    ]
    for feat, sv in sorted(shap_importance.items(), key=lambda x: -x[1]):
        md_lines.append(f"| {feat} | {sv:.4f} |")

    md_lines += [
        "",
        "## Design Decisions",
        "- **Random Forest** chosen over Logistic Regression because the target is",
        "  continuous (300–900), making regression the appropriate formulation.",
        "  Ridge was used as the linear baseline for the same reason.",
        "- **No feature scaling** for RF (tree-based model is scale-invariant).",
        "  Scaler is retained for any future linear model that may be added.",
        "- **SHAP TreeExplainer** used (exact, not kernel) for speed in production.",
        "  Per-request SHAP values are computed on a single row.",
    ]

    with open(DOCS_DIR / "model_metrics.md", "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"[OK] Model metrics saved to {DOCS_DIR / 'model_metrics.md'}")

    return meta


if __name__ == "__main__":
    df = load_data()
    meta = train(df)
    print("\n[OK] Training complete!")
    print(f"   RF R²   = {meta['rf_metrics']['r2']}")
    print(f"   RF MAE  = {meta['rf_metrics']['mae']} score points")
    sys.exit(0)
