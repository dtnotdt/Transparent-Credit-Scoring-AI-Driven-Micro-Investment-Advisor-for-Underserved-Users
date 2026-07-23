import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Sparkles, TrendingUp, Sliders, AlertCircle, CheckCircle2, ShieldCheck, Download, BarChart2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { CreditSimulatorModal } from '../components/CreditSimulatorModal';
import { ShapDashboardModal } from '../components/ShapDashboardModal';
import { useAuth } from '../context/AuthContext';
import { api, CreditScoreRequest, CreditScoreResponse, ShapContribution } from '../api/client';

export const CreditScoringPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreditScoreRequest>({
    recharge_frequency: 15,
    bill_payment_regularity: 85,
    upi_transaction_count: 80,
    wallet_usage_score: 65,
    monthly_savings_pct: 18,
    ecommerce_frequency: 10,
    bank_balance_stability: 70,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreditScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isShapOpen, setIsShapOpen] = useState(false);

  const handleChange = (key: keyof CreditScoreRequest, val: number) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<CreditScoreResponse>('/credit-score', formData);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compute credit score. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (simulatedValues: CreditScoreRequest) => {
    const res = await api.post<CreditScoreResponse>('/credit-score', simulatedValues);
    return { score: res.data.score, shap_top3: res.data.shap_top3 };
  };

  // Helper for gauge arc percentage
  const scorePercent = result ? Math.min(100, Math.max(0, ((result.score - 300) / (900 - 300)) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header title */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-200 text-red-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Transparent Credit Scoring
            </h1>
            <p className="text-slate-500 text-sm">
              Alternative digital-behavior assessment powered by Random Forest & SHAP Explainability
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard>
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              Digital Behavioral Inputs
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bill Payment Regularity */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Bill Payment Regularity (%)</span>
                  <span className="text-red-600 font-mono">{formData.bill_payment_regularity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.bill_payment_regularity}
                  onChange={(e) => handleChange('bill_payment_regularity', Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Recharge Frequency */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Mobile Recharge Frequency (per month)</span>
                  <span className="text-red-600 font-mono">{formData.recharge_frequency}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={formData.recharge_frequency}
                  onChange={(e) => handleChange('recharge_frequency', Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* UPI Transaction Count */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>UPI Transaction Volume (monthly)</span>
                  <span className="text-red-600 font-mono">{formData.upi_transaction_count}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={formData.upi_transaction_count}
                  onChange={(e) => handleChange('upi_transaction_count', Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Wallet Usage Score */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Wallet Usage Index (0-100)</span>
                  <span className="text-red-600 font-mono">{formData.wallet_usage_score}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.wallet_usage_score}
                  onChange={(e) => handleChange('wallet_usage_score', Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Monthly Savings % */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Monthly Income Saved (%)</span>
                  <span className="text-red-600 font-mono">{formData.monthly_savings_pct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={formData.monthly_savings_pct}
                  onChange={(e) => handleChange('monthly_savings_pct', Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* E-Commerce Frequency */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>E-Commerce Orders / Month</span>
                  <span className="text-red-600 font-mono">{formData.ecommerce_frequency}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.ecommerce_frequency}
                  onChange={(e) => handleChange('ecommerce_frequency', Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Bank Balance Stability */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Bank Balance Stability Index (0-100)</span>
                  <span className="text-red-600 font-mono">{formData.bank_balance_stability}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.bank_balance_stability}
                  onChange={(e) => handleChange('bank_balance_stability', Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Computing Explainable AI Score...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Assess Alternative Credit Score</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Results Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <GlassCard glow>
              <div className="text-center space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 inline-block">
                  CIBIL Scale Assessment
                </span>

                {/* Score Gauge Arc */}
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-100 stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-red-600 stroke-current transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={`${scorePercent * 2.51} 251`}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono font-extrabold text-4xl text-slate-900">
                      {result.score}
                    </span>
                    <span className="text-xs text-red-600 font-bold mt-1">{result.score_label}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  Risk Category: <span className="font-semibold text-slate-900">{result.risk_category}</span>
                </div>

                {/* SHAP Feature Contribution Summary */}
                <div className="border-t border-slate-200 pt-4 text-left space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Key Driving Factors (SHAP Explainer)
                  </h4>
                  <div className="space-y-1.5">
                    {result.shap_top3.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-700 font-medium">{item.feature}</span>
                        <span
                          className={`font-mono font-bold ${
                            item.direction === 'positive' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {item.direction === 'positive' ? '+' : ''}
                          {item.contribution_score.toFixed(1)} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="border-t border-slate-200 pt-4 text-left space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Tailored Score Improvements
                  </h4>
                  <div className="space-y-1.5">
                    {result.suggestions.slice(0, 2).map((sug, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsSimulatorOpen(true)}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    What-If Simulator
                  </button>
                  <button
                    onClick={() => setIsShapOpen(true)}
                    className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/20"
                  >
                    <BarChart2 className="w-4 h-4 text-amber-300" />
                    Full SHAP Tree
                  </button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-display font-semibold text-slate-900 text-sm">No Score Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Adjust your digital behavioral sliders on the left and click "Assess Alternative Credit Score" to view your SHAP explainability breakdown.
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* What-If Simulator Modal */}
      {result && (
        <CreditSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          initialScore={result.score}
          initialValues={formData}
          onSimulate={handleSimulate}
        />
      )}

      {/* SHAP Dashboard Modal */}
      {result && (
        <ShapDashboardModal
          isOpen={isShapOpen}
          onClose={() => setIsShapOpen(false)}
          score={result.score}
          riskCategory={result.risk_category}
          shapContributions={result.shap_top3}
        />
      )}
    </div>
  );
};
