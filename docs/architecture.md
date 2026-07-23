# Architecture & System Diagrams

Comprehensive technical specification for TetraTHON 2026 Transparent Credit Scoring & AI-Powered Micro Investment Advisor.

---

## 1. System Architecture Diagram

```mermaid
graph TD
    Client[React 19 + Vite Frontend\nTailwind CSS + Framer Motion] -->|HTTP / REST API| API[FastAPI Backend\nPython 3.11]
    API -->|ORM Queries| DB[(SQLite Dev / PostgreSQL Prod)]
    API -->|Inference & SHAP| ML[Random Forest Model\nSHAP TreeExplainer]
    API -->|PDF Generation| PDF[FPDF2 Engine]
    
    subgraph Frontend Components
        Dashboard[Dashboard Page]
        CreditPage[Credit Scoring Module]
        RiskPage[Risk Profiler Module]
        InvPage[Investment Plan Module]
        VoiceBot[Multi-lang Voice Chatbot]
    end

    subgraph ML Pipeline
        Dataset[1200 Synthetic Users] -->|Train| RF[Random Forest Regressor]
        RF -->|Serialize| Joblib[joblib Artifacts]
        Joblib --> Explainer[SHAP TreeExplainer]
    end
```

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ CREDIT_ASSESSMENTS : has
    USERS ||--o{ RISK_ASSESSMENTS : has

    USERS {
        int id PK
        string email UK
        string username UK
        string hashed_password
        boolean is_active
        datetime created_at
    }

    CREDIT_ASSESSMENTS {
        int id PK
        int user_id FK
        float recharge_frequency
        float bill_payment_regularity
        float upi_transaction_count
        float wallet_usage_score
        float monthly_savings_pct
        float ecommerce_frequency
        float bank_balance_stability
        int credit_score
        json shap_top3
        json suggestions
        datetime created_at
    }

    RISK_ASSESSMENTS {
        int id PK
        int user_id FK
        json answers
        string risk_level
        string rationale
        json score_breakdown
        datetime created_at
    }
```

---

## 3. Credit Score Request Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Frontend
    participant API as FastAPI Router (/credit-score)
    participant Auth as JWT Middleware
    participant ML as ML Service (RF + SHAP)
    participant DB as Database

    User->>FE: Slide behavioral inputs & submit
    FE->>API: POST /api/v1/credit-score (JWT header)
    API->>Auth: Validate JWT token
    Auth-->>API: User authenticated
    API->>ML: predict_credit_score(features)
    ML->>ML: Run RF model (predict score 300-900)
    ML->>ML: Compute SHAP values for 7 features
    ML->>ML: Extract Top-3 positive/negative drivers & suggestions
    ML-->>API: score, shap_top3, suggestions
    API->>DB: Save CreditAssessment record
    API-->>FE: 200 OK (CreditScoreResponse + legal disclaimer)
    FE-->>User: Render Gauge meter, SHAP breakdown & tips
```

---

## 4. Workflow Diagram

```mermaid
flowchart LR
    A[User Register/Login] --> B[Dashboard]
    B --> C[Module 1: Credit Score]
    B --> D[Module 2: Risk Profiler Bot]
    B --> E[Module 3: Investment Plan]
    
    C -->|Simulate What-if| F[Credit Simulator Sliders]
    D -->|8 Questions| G[Low/Medium/High Risk]
    G -->|Auto Feed| E
    E -->|Compound SIP| H[1/3/5 Year Growth Bands Chart]
    
    B -->|Export| I[CSV Export / PDF Report]
```

---

## 5. Backend Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string username
        +string hashed_password
        +bool is_active
        +datetime created_at
    }

    class CreditAssessment {
        +int id
        +int user_id
        +float recharge_frequency
        +float bill_payment_regularity
        +float upi_transaction_count
        +float wallet_usage_score
        +float monthly_savings_pct
        +float ecommerce_frequency
        +float bank_balance_stability
        +int credit_score
        +json shap_top3
        +json suggestions
    }

    class RiskAssessment {
        +int id
        +int user_id
        +json answers
        +string risk_level
        +string rationale
        +json score_breakdown
    }

    User "1" <-- "*" CreditAssessment
    User "1" <-- "*" RiskAssessment
```
