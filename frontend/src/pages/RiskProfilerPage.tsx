import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ShieldCheck, CheckCircle2, HelpCircle, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api, RiskProfileRequest, RiskProfileResponse } from '../api/client';

export const RiskProfilerPage: React.FC = () => {
  const [formData, setFormData] = useState<RiskProfileRequest>({
    age: 28,
    monthly_income: 50000,
    occupation: 'Salaried Private',
    monthly_savings: 12000,
    investment_amount: 5000,
    has_emergency_fund: true,
    investment_duration_years: 5,
    market_loss_reaction: 'hold',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<RiskProfileResponse>('/risk-profile', formData);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to classify risk profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-200 text-red-600">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Conversational Risk Profiler
          </h1>
          <p className="text-slate-500 text-sm">
            Inspectable 8-factor rule classifier to evaluate your investment risk tolerance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard>
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              8-Factor Financial Assessment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Income (₹)</label>
                  <input
                    type="number"
                    value={formData.monthly_income}
                    onChange={(e) => setFormData({ ...formData, monthly_income: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation Type</label>
                  <select
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none"
                  >
                    <option>Salaried Private</option>
                    <option>Salaried Government</option>
                    <option>Self-Employed / Business</option>
                    <option>Gig Worker / Freelancer</option>
                    <option>Student / Homemaker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Savings (₹)</label>
                  <input
                    type="number"
                    value={formData.monthly_savings}
                    onChange={(e) => setFormData({ ...formData, monthly_savings: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Monthly SIP (₹)</label>
                  <input
                    type="number"
                    value={formData.investment_amount}
                    onChange={(e) => setFormData({ ...formData, investment_amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Horizon (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.investment_duration_years}
                    onChange={(e) => setFormData({ ...formData, investment_duration_years: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Fund (&gt; 3 Months)</label>
                  <select
                    value={formData.has_emergency_fund ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, has_emergency_fund: e.target.value === 'yes' })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none"
                  >
                    <option value="yes">Yes, Emergency Fund Built</option>
                    <option value="no">No Emergency Reserves</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Market Loss Reaction</label>
                  <select
                    value={formData.market_loss_reaction}
                    onChange={(e) => setFormData({ ...formData, market_loss_reaction: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none"
                  >
                    <option value="buy_more">Buy More (Aggressive)</option>
                    <option value="hold">Hold Patiently (Moderate)</option>
                    <option value="sell_all">Sell Immediately (Conservative)</option>
                  </select>
                </div>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Evaluating 8-Factor Classifier...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4 text-amber-300" />
                    <span>Classify Risk Tier</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <GlassCard glow>
              <div className="text-center space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 inline-block">
                  Identified Risk Profile
                </span>

                <div>
                  <h3 className="font-display font-extrabold text-3xl text-slate-900">
                    {result.risk_level}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {result.summary}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-4 text-left space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    8-Factor Decision Rule Breakdown
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(result.factor_breakdown).map(([factor, score]) => (
                      <div key={factor} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-700 font-medium capitalize">{factor.replace(/_/g, ' ')}</span>
                        <span className="text-red-600 font-bold font-mono">+{score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="/investment-plan"
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span>View Recommended Portfolio SIP</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </a>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="text-center py-12">
              <Compass className="w-10 h-10 text-red-600 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-slate-900 text-sm">No Risk Tier Classified</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Fill in your financial parameters on the left and submit to determine your Risk Profile Tier.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
