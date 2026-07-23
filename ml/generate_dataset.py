"""
generate_dataset.py
────────────────────
Generates ≥1000 synthetic users with realistic, correlated distributions
for the TetraTHON Credit Scoring system.

Features generated
──────────────────
- recharge_frequency     : 1-30 recharges/month  (higher = more engaged)
- bill_payment_regularity: 0-100 score (% of bills paid on time last 12mo)
- upi_transaction_count  : 0-200 UPI txns/month
- wallet_usage_score     : 0-100 (frequency + amount composite)
- monthly_savings_pct    : 0-40% of income saved
- ecommerce_frequency    : 0-60 orders/month
- bank_balance_stability : 0-100 (coefficient of variation inverted)
- monthly_income         : 5000-150000 INR

Derived outputs
───────────────
- credit_score   : 300-900 (weighted composite + noise)
- risk_profile   : Low / Medium / High (deterministic from score + savings)
- recommended_allocation : JSON string with asset percentages
"""

import json
import os
import sys

import numpy as np
import pandas as pd

# ─── Reproducibility ──────────────────────────────────────────────────────────
RNG = np.random.default_rng(seed=42)
N = 1200  # ≥1000 as required

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "synthetic_users.csv")


def generate_users(n: int = N) -> pd.DataFrame:
    # ── Latent "financial health" factor z ∈ [0,1] drives correlations
    z = RNG.beta(a=2, b=2, size=n)  # bell-shaped, most users middling

    # ── Feature generation (all correlated through z) ──────────────────────
    recharge_frequency = np.clip(
        (z * 25 + RNG.normal(3, 2, n)).astype(int), 1, 30
    )
    bill_payment_regularity = np.clip(
        z * 80 + RNG.normal(10, 10, n), 0, 100
    )
    upi_transaction_count = np.clip(
        (z * 150 + RNG.normal(20, 15, n)).astype(int), 0, 200
    )
    wallet_usage_score = np.clip(
        z * 70 + RNG.normal(15, 10, n), 0, 100
    )
    monthly_savings_pct = np.clip(
        z * 35 + RNG.normal(2, 4, n), 0, 40
    )
    ecommerce_frequency = np.clip(
        (z * 50 + RNG.normal(5, 5, n)).astype(int), 0, 60
    )
    bank_balance_stability = np.clip(
        z * 80 + RNG.normal(10, 12, n), 0, 100
    )
    # Income is weakly correlated with z but has a wide distribution
    monthly_income = np.clip(
        (z * 100_000 + RNG.normal(20_000, 25_000, n)).astype(int), 5_000, 150_000
    )

    # ── Credit score (300-900) via weighted sum + noise ─────────────────────
    # Weights reflect relative importance (mirrors future SHAP results)
    raw_score = (
        0.20 * bill_payment_regularity        # 0-100
        + 0.18 * (recharge_frequency / 30 * 100)  # normalised to 0-100
        + 0.18 * (upi_transaction_count / 200 * 100)
        + 0.15 * bank_balance_stability
        + 0.14 * monthly_savings_pct * 2.5    # 0-100
        + 0.10 * wallet_usage_score
        + 0.05 * (ecommerce_frequency / 60 * 100)
    )  # raw_score ∈ [0, 100]

    noise = RNG.normal(0, 4, n)
    credit_score = np.clip(
        (raw_score + noise) / 100 * (900 - 300) + 300, 300, 900
    ).astype(int)

    # ── Risk profile ─────────────────────────────────────────────────────────
    def assign_risk(score: int, savings: float) -> str:
        if score >= 700 and savings >= 15:
            return "High"
        elif score >= 550 and savings >= 7:
            return "Medium"
        else:
            return "Low"

    risk_profiles = np.array([
        assign_risk(int(s), float(sv))
        for s, sv in zip(credit_score, monthly_savings_pct)
    ])

    # ── Investment allocation ─────────────────────────────────────────────────
    ALLOCATIONS = {
        "Low":    {"FD": 40, "Government Bonds": 35, "Debt Mutual Fund": 25},
        "Medium": {"Hybrid Fund": 35, "Index Fund": 35, "Gold ETF": 30},
        "High":   {"Equity Mutual Fund": 40, "ETF": 35, "Blue-chip Equity": 25},
    }

    allocations = np.array([
        json.dumps(ALLOCATIONS[r]) for r in risk_profiles
    ])

    # ── Assemble DataFrame ────────────────────────────────────────────────────
    df = pd.DataFrame({
        "user_id":                 [f"SU{str(i).zfill(4)}" for i in range(1, n + 1)],
        "recharge_frequency":      recharge_frequency,
        "bill_payment_regularity": bill_payment_regularity.round(2),
        "upi_transaction_count":   upi_transaction_count,
        "wallet_usage_score":      wallet_usage_score.round(2),
        "monthly_savings_pct":     monthly_savings_pct.round(2),
        "ecommerce_frequency":     ecommerce_frequency,
        "bank_balance_stability":  bank_balance_stability.round(2),
        "monthly_income":          monthly_income,
        "credit_score":            credit_score,
        "risk_profile":            risk_profiles,
        "recommended_allocation":  allocations,
    })

    return df


def validate(df: pd.DataFrame) -> None:
    assert len(df) >= 1000, f"Expected ≥1000 rows, got {len(df)}"
    assert df.isnull().sum().sum() == 0, "DataFrame contains nulls!"
    assert df["credit_score"].between(300, 900).all(), "Score out of [300,900]"
    assert df["risk_profile"].isin({"Low", "Medium", "High"}).all()
    print("[OK] Validation passed.")


def print_summary(df: pd.DataFrame) -> None:
    print("\n" + "=" * 60)
    print(f"  Synthetic dataset: {len(df)} rows x {len(df.columns)} columns")
    print("=" * 60)
    print(df[["credit_score", "monthly_savings_pct", "monthly_income"]].describe().round(2))
    print("\nRisk profile distribution:")
    print(df["risk_profile"].value_counts())
    print("=" * 60 + "\n")


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df = generate_users(N)
    validate(df)
    print_summary(df)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"[OK] Saved {len(df)} users to {OUTPUT_PATH}")
    sys.exit(0)
