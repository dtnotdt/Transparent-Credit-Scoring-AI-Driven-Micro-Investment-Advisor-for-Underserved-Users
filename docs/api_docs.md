# API Reference Documentation

All endpoints respond with standardized Pydantic JSON schemas. OpenAPI documentation is interactively accessible at `/docs` or `/redoc`.

---

## Base URL
- Local Dev: `http://localhost:8000/api/v1`
- Docker Compose: `http://localhost:8000/api/v1`

---

## Endpoints Summary Table

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | User registration, returns JWT token |
| `POST` | `/auth/login` | No | User authentication, returns JWT token |
| `POST` | `/credit-score` | Yes | Predict credit score (300-900), SHAP top-3 drivers, and suggestions |
| `POST` | `/risk-profile` | Yes | 8-question rule-based risk profiler (Low/Medium/High) |
| `POST` | `/investment-plan` | Yes | SIP asset allocation & 1/3/5y growth band projections |
| `GET`  | `/dashboard/{user_id}` | Yes | Aggregated user dashboard view & activity history |
| `GET`  | `/sample-users` | No | Paginated list of synthetic users for dataset exploration |
| `GET`  | `/export-csv/{user_id}` | Yes | Download credit assessment history as CSV file |
| `POST` | `/report-pdf` | Yes | Download complete PDF report combining score + risk + investment plan |

---

## Sample Endpoint Payload & Response

### 1. `POST /api/v1/credit-score`

**Request:**
```json
{
  "recharge_frequency": 15,
  "bill_payment_regularity": 85.0,
  "upi_transaction_count": 80,
  "wallet_usage_score": 65.0,
  "monthly_savings_pct": 18.0,
  "ecommerce_frequency": 10,
  "bank_balance_stability": 70.0
}
```

**Response (200 OK):**
```json
{
  "score": 624,
  "score_label": "Fair",
  "shap_top3": [
    {
      "feature": "recharge_frequency",
      "contribution": 31.42,
      "direction": "positive",
      "display_label": "Mobile Recharge Frequency +31"
    },
    {
      "feature": "upi_transaction_count",
      "contribution": 28.15,
      "direction": "positive",
      "display_label": "UPI Transaction Activity +28"
    },
    {
      "feature": "bill_payment_regularity",
      "contribution": 22.10,
      "direction": "positive",
      "display_label": "Utility Bill Payments +22"
    }
  ],
  "suggestions": [
    "Use your digital wallet more frequently.",
    "Avoid letting your bank balance drop to near-zero each month.",
    "Moderate, regular e-commerce activity signals digital financial engagement."
  ],
  "disclaimer": "This application is for educational purposes only and does not provide regulated financial or investment advice."
}
```

---

### 2. `POST /api/v1/risk-profile`

**Request:**
```json
{
  "age": 28,
  "monthly_income": 50000,
  "occupation": "Salaried Private",
  "monthly_savings": 12000,
  "investment_amount": 5000,
  "has_emergency_fund": true,
  "investment_duration_years": 5,
  "market_loss_reaction": "hold"
}
```

**Response (200 OK):**
```json
{
  "risk_level": "Medium",
  "answers_echo": { ... },
  "rationale": "Your total risk score is 59/100. You have moderate risk capacity. A balanced portfolio of hybrid and index funds would suit your profile.",
  "score_breakdown": {
    "age_score": 15,
    "duration_score": 15,
    "reaction_score": 15,
    "emergency_fund_score": 15,
    "savings_ratio_score": 10,
    "investment_ratio_score": 4
  },
  "disclaimer": "This application is for educational purposes only and does not provide regulated financial or investment advice."
}
```
