# Model Metrics Report

Generated automatically by `ml/train_model.py`.

## Dataset
- Rows: 1200
- Features: recharge_frequency, bill_payment_regularity, upi_transaction_count, wallet_usage_score, monthly_savings_pct, ecommerce_frequency, bank_balance_stability
- Target: `credit_score` (range 300–900)
- Train/Test split: 80 / 20

## Model Comparison

| Metric | Ridge (Baseline) | Random Forest (Winner) |
|--------|-----------------|------------------------|
| MAE    | 19.44 | **21.50** |
| RMSE   | 23.50 | **25.90** |
| R²     | 0.9543 | **0.9445** |

5-fold CV R² (RF): **0.9423 ± 0.0030**

## Feature Importances (RF)

| Feature | Importance |
|---------|------------|
| recharge_frequency | 0.3766 |
| upi_transaction_count | 0.3160 |
| bill_payment_regularity | 0.1773 |
| monthly_savings_pct | 0.0659 |
| bank_balance_stability | 0.0299 |
| ecommerce_frequency | 0.0190 |
| wallet_usage_score | 0.0153 |

## SHAP Mean |value|

| Feature | Mean |SHAP| |
|---------|-------------|
| recharge_frequency | 30.5731 |
| upi_transaction_count | 29.8059 |
| bill_payment_regularity | 20.4212 |
| monthly_savings_pct | 10.6175 |
| bank_balance_stability | 7.7227 |
| wallet_usage_score | 4.5908 |
| ecommerce_frequency | 3.1923 |

## Design Decisions
- **Random Forest** chosen over Logistic Regression because the target is
  continuous (300–900), making regression the appropriate formulation.
  Ridge was used as the linear baseline for the same reason.
- **No feature scaling** for RF (tree-based model is scale-invariant).
  Scaler is retained for any future linear model that may be added.
- **SHAP TreeExplainer** used (exact, not kernel) for speed in production.
  Per-request SHAP values are computed on a single row.