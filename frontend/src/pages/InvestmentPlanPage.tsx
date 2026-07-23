import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart as PieIcon, ShieldCheck, ArrowRight, DollarSign, Activity, AlertCircle, LineChart as LineIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { api, InvestmentPlanRequest, InvestmentPlanResponse } from '../api/client';

const PIE_COLORS = ['#dc2626', '#f59e0b', '#eab308', '#b91c1c'];

export const InvestmentPlanPage: React.FC = () => {
  const [formData, setFormData] = useState<InvestmentPlanRequest>({
    monthly_budget: 5000,
    risk_level: 'Moderate',
    investment_goal: 'Wealth Creation',
    horizon_years: 5,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvestmentPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<InvestmentPlanResponse>('/investment-plan', formData);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate investment plan.');
    } finally {
      setLoading(false);
    }
  };

  const pieData = result
    ? Object.entries(result.asset_allocation).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-200 text-red-600">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Micro-Investment Advisor
          </h1>
          <p className="text-slate-500 text-sm">
            Personalized low-risk & equity micro-SIP allocations starting from ₹100/month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard>
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              Plan Configuration
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Budget (₹)</label>
                <input
                  type="number"
                  min="100"
                  max="100000"
                  value={formData.monthly_budget}
                  onChange={(e) => setFormData({ ...formData, monthly_budget: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Tolerance Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Moderate', 'High'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setFormData({ ...formData, risk_level: tier })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        formData.risk_level === tier
                          ? 'bg-red-600 text-white border-red-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Investment Horizon (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.horizon_years}
                  onChange={(e) => setFormData({ ...formData, horizon_years: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-red-600 outline-none"
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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Calculating Optimal SIP...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-amber-300" />
                    <span>Generate Asset Allocation</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              <GlassCard glow>
                <h3 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-red-600" />
                  Recommended Asset Allocation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2.5">
                    {pieData.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <span className="text-slate-700 font-medium">{item.name}</span>
                        </div>
                        <span className="font-mono text-red-600 font-bold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Projection Chart */}
              {result.growth_projection && (
                <GlassCard>
                  <h3 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center gap-2">
                    <LineIcon className="w-4 h-4 text-red-600" />
                    Growth Trajectory ({formData.horizon_years}-Year Projection)
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.growth_projection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} />
                        <YAxis stroke="#94A3B8" fontSize={11} />
                        <Tooltip />
                        <Line type="monotone" dataKey="expected_value" stroke="#dc2626" strokeWidth={3} name="Expected Value" />
                        <Line type="monotone" dataKey="best_case" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" name="Best Case" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}
            </>
          ) : (
            <GlassCard className="text-center py-12">
              <TrendingUp className="w-10 h-10 text-red-600 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-slate-900 text-sm">No Allocation Plan Generated</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Configure your monthly budget and risk tolerance level on the left to generate your micro-investment portfolio.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
