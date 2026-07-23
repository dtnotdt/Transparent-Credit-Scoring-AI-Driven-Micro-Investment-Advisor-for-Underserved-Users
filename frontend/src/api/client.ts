import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle expired tokens / 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.endsWith('/login') && !window.location.pathname.endsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  auth_provider?: 'local' | 'google';
  preferred_language?: 'en' | 'hi' | 'gu';
  is_active?: boolean;
  created_at?: string;
  latest_credit_score?: number | null;
  latest_risk_level?: string | null;
  has_financial_twin?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  auth_provider?: 'local' | 'google';
  preferred_language?: 'en' | 'hi' | 'gu';
}

export interface CoachRequest {
  credit_score: number;
  shap_factors: any[];
  monthly_savings_pct: number;
  monthly_income: number;
  risk_level?: string;
  language?: 'en' | 'hi' | 'gu';
  messages?: any[];
}


export interface CreditScoreRequest {
  recharge_frequency: number;
  bill_payment_regularity: number;
  upi_transaction_count: number;
  wallet_usage_score: number;
  monthly_savings_pct: number;
  ecommerce_frequency: number;
  bank_balance_stability: number;
}

export interface ShapContribution {
  feature: string;
  contribution: number;
  direction: 'positive' | 'negative';
  display_label: string;
}

export interface DetailedShapFeature {
  feature: string;
  feature_name: string;
  user_value: number;
  shap_value: number;
  direction: 'helps' | 'hurts';
  impact_points: number;
  english_explanation: string;
}

export interface ShapExplanationResponse {
  user_id: number;
  base_value: number;
  final_score: number;
  summary_headline: string;
  features: DetailedShapFeature[];
  disclaimer: string;
}

export interface CreditScoreResponse {
  score: number;
  score_label: string;
  shap_top3: ShapContribution[];
  suggestions: string[];
  disclaimer: string;
}

export interface RiskProfileRequest {
  age: number;
  monthly_income: number;
  occupation: string;
  monthly_savings: number;
  investment_amount: number;
  has_emergency_fund: boolean;
  investment_duration_years: number;
  market_loss_reaction: 'panic_sell' | 'hold' | 'buy_more';
}

export interface RiskProfileResponse {
  risk_level: 'Low' | 'Medium' | 'High';
  answers_echo: Record<string, any>;
  rationale: string;
  score_breakdown: Record<string, number>;
  disclaimer: string;
}

export interface InvestmentPlanRequest {
  risk_level: 'Low' | 'Medium' | 'High';
  monthly_investment: number;
}

export interface ScenarioProjection {
  worst: number;
  avg: number;
  best: number;
}

export interface InvestmentPlanResponse {
  risk_level: string;
  allocation: Record<string, number>;
  projections: Record<string, ScenarioProjection>;
  assumed_rates: Record<string, Record<string, number>>;
  total_invested: Record<string, number>;
  disclaimer: string;
}

export interface ActivityItem {
  timestamp: string;
  event_type: string;
  description: string;
}

export interface DashboardResponse {
  user_id: number;
  username: string;
  latest_credit_score: number | null;
  credit_score_label: string | null;
  latest_risk_level: string | null;
  latest_allocation: Record<string, number> | null;
  health_score: number | null;
  recent_activity: ActivityItem[];
  suggestions: string[];
  disclaimer: string;
}

export interface SampleUser {
  user_id: string;
  recharge_frequency: number;
  bill_payment_regularity: number;
  upi_transaction_count: number;
  wallet_usage_score: number;
  monthly_savings_pct: number;
  ecommerce_frequency: number;
  bank_balance_stability: number;
  monthly_income: number;
  credit_score: number;
  risk_profile: string;
  recommended_allocation: string;
}

export interface SampleUsersResponse {
  total: number;
  page: number;
  page_size: number;
  users: SampleUser[];
}

export interface FinancialTwinProjection {
  credit_score: number;
  savings: number;
  investment_value: number;
  net_worth: number;
  risk_level: string;
}

export interface FinancialTwinResponse {
  twin_id: number;
  user_id: number;
  generated_at: string;
  current_credit_score: number;
  current_savings_monthly: number;
  current_investment_monthly: number;
  current_risk_level: string;
  projection_1y: FinancialTwinProjection;
  projection_3y: FinancialTwinProjection;
  projection_5y: FinancialTwinProjection;
  coach_summary: string;
  disclaimer: string;
}

export interface AdminUsersListResponse {
  total: number;
  page: number;
  page_size: number;
  users: UserInfo[];
}
