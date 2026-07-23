-- TetraTHON 2026 Database Schema (PostgreSQL 16 / SQLite compatible)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recharge_frequency FLOAT NOT NULL,
    bill_payment_regularity FLOAT NOT NULL,
    upi_transaction_count FLOAT NOT NULL,
    wallet_usage_score FLOAT NOT NULL,
    monthly_savings_pct FLOAT NOT NULL,
    ecommerce_frequency FLOAT NOT NULL,
    bank_balance_stability FLOAT NOT NULL,
    credit_score INTEGER NOT NULL,
    shap_top3 JSON,
    suggestions JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSON NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    rationale VARCHAR(1000),
    score_breakdown JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_user ON credit_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_user ON risk_assessments(user_id);
