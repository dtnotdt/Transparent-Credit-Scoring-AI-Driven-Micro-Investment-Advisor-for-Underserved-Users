import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Compass,
  Download,
  Bot,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { api, FinancialTwinResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const FinancialTwinPage: React.FC = () => {
  const { user } = useAuth();
  const [twin, setTwin] = useState<FinancialTwinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'1y' | '3y' | '5y'>('5y');

  // Load latest financial twin on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchTwin();
  }, [user]);

  const fetchTwin = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<FinancialTwinResponse>(`/financial-twin/${user.id}`);
      setTwin(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // No twin generated yet, attempt auto-generation if user has credit assessment
        handleGenerateTwin(true);
      } else {
        setError(err?.response?.data?.detail || 'Failed to load Financial Twin.');
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTwin = async (isAuto = false) => {
    if (!user) return;
    setGenerating(true);
    if (!isAuto) setError(null);
    try {
      const res = await api.post<FinancialTwinResponse>('/financial-twin', {});
      setTwin(res.data);
      setError(null);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 422) {
        setError(detail || 'Please complete your Credit Score assessment first.');
      } else {
        setError(detail || 'Failed to generate Financial Twin simulation.');
      }
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!user || !twin) return;
    setPdfLoading(true);
    try {
      const response = await api.get(`/financial-twin/${user.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_twin_${user.username}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download Financial Twin PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-200 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500 font-medium">Initializing AI Financial Twin engine...</p>
      </div>
    );
  }

  // Projection data for Recharts Timeline
  const chartData = twin
    ? [
        {
          horizon: 'Today',
          creditScore: twin.current_credit_score,
          savings: twin.current_savings_monthly,
          investmentValue: twin.current_investment_monthly,
          netWorth: twin.current_savings_monthly * 12 + twin.current_investment_monthly,
        },
        {
          horizon: '1 Year',
          creditScore: twin.projection_1y.credit_score,
          savings: twin.projection_1y.savings,
          investmentValue: twin.projection_1y.investment_value,
          netWorth: twin.projection_1y.net_worth,
        },
        {
          horizon: '3 Years',
          creditScore: twin.projection_3y.credit_score,
          savings: twin.projection_3y.savings,
          investmentValue: twin.projection_3y.investment_value,
          netWorth: twin.projection_3y.net_worth,
        },
        {
          horizon: '5 Years',
          creditScore: twin.projection_5y.credit_score,
          savings: twin.projection_5y.savings,
          investmentValue: twin.projection_5y.investment_value,
          netWorth: twin.projection_5y.net_worth,
        },
      ]
    : [];

  const selectedProj = twin
    ? activeTab === '1y'
      ? twin.projection_1y
      : activeTab === '3y'
      ? twin.projection_3y
      : twin.projection_5y
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-200 text-xs text-amber-200/90 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Educational Simulation:</strong> The Financial Twin generates futuristic projections using authenticated user data, historical market trends, and behavioral credit algorithms. Projections are for educational and planning purposes only and do not constitute formal financial advice.
          </span>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-0.5 rounded-full shadow-md shadow-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Autonomous Financial Twin
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
            AI-Powered <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">Financial Twin</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Simulating your future financial behavior, net worth trajectories, and credit evolution based on real profile data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleGenerateTwin(false)}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Simulating...' : 'Recalculate Twin'}
          </button>

          {twin && (
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 border border-emerald-400/30"
            >
              {pdfLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <Download className="w-4 h-4 text-emerald-200" />
              )}
              Export Twin PDF
            </button>
          )}
        </div>
      </div>

      {error && (
        <GlassCard className="border-red-200 bg-red-50 text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes('Credit Score assessment') && (
            <Link
              to="/credit-score"
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 text-xs font-medium border border-red-200 flex items-center gap-1 shrink-0"
            >
              Take Assessment <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </GlassCard>
      )}

      {twin && (
        <>
          {/* Today's Snapshot Grid */}
          <div className="space-y-3">
            <h2 className="font-display text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Today's Financial Baseline (Real Profile Data)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today's Credit Score */}
              <GlassCard glow>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase font-medium">Today's Credit Score</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-slate-900">
                    {twin.current_credit_score}
                  </span>
                  <span className="text-xs font-semibold text-emerald-300">
                    / 900
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">Stored in PostgreSQL DB</div>
              </GlassCard>

              {/* Today's Savings */}
              <GlassCard>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase font-medium">Today's Savings / mo</span>
                  <PiggyBank className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-emerald-400">
                    ₹{twin.current_savings_monthly.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">Derived from monthly savings rate</div>
              </GlassCard>

              {/* Today's Investment */}
              <GlassCard>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase font-medium">Today's SIP Investment</span>
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-teal-300">
                    ₹{twin.current_investment_monthly.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500">/ mo</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">Active monthly SIP commitment</div>
              </GlassCard>

              {/* Today's Risk Level */}
              <GlassCard>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase font-medium">Today's Risk Profile</span>
                  <Compass className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-amber-300">
                    {twin.current_risk_level}
                  </span>
                  <span className="text-xs text-amber-400/80 font-medium">Band</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">Evaluated via Rule Engine</div>
              </GlassCard>
            </div>
          </div>

          {/* AI Financial Coach Explanation Banner */}
          <GlassCard className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/60 border-emerald-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <Bot className="w-6 h-6 text-slate-900" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-slate-900 text-lg">
                    AI Financial Coach Summary & Projection Rationale
                  </h3>
                  <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200">
                    Neural Intelligence
                  </span>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {twin.coach_summary}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Before vs After Comparison & Horizon Selectors */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Before vs After Financial Twin Comparison
              </h2>

              {/* Time Horizon Selector Tabs */}
              <div className="flex items-center bg-white/80 border border-slate-200 p-1 rounded-xl">
                {(['1y', '3y', '5y'] as const).map((horizon) => (
                  <button
                    key={horizon}
                    onClick={() => setActiveTab(horizon)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === horizon
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {horizon === '1y' ? '1 Year' : horizon === '3y' ? '3 Years' : '5 Years'} Projection
                  </button>
                ))}
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Credit Score Delta Card */}
              <motion.div
                key={`credit-${activeTab}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard glow className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Credit Score Evolution</span>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Today</div>
                      <div className="text-xl font-bold text-slate-600">{twin.current_credit_score}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-300 font-semibold uppercase">{activeTab.toUpperCase()} Future</div>
                      <div className="text-2xl font-extrabold text-emerald-400">{selectedProj?.credit_score}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Projected Delta</span>
                    <span className="font-extrabold font-mono text-emerald-400">
                      +{selectedProj ? selectedProj.credit_score - twin.current_credit_score : 0} points
                    </span>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Investment Value & Net Worth Card */}
              <motion.div
                key={`networth-${activeTab}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <GlassCard glow className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Future Net Worth</span>
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase">SIP Corpus</div>
                      <div className="text-lg font-bold text-teal-300">
                        ₹{selectedProj?.investment_value.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-300 font-semibold uppercase">Total Net Worth</div>
                      <div className="text-xl font-extrabold text-emerald-400">
                        ₹{selectedProj?.net_worth.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Monthly Savings Target</span>
                    <span className="font-bold font-mono text-slate-700">
                      ₹{selectedProj?.savings.toLocaleString('en-IN')} / mo
                    </span>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Risk Profile & Capability Evolution */}
              <motion.div
                key={`risk-${activeTab}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <GlassCard glow className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Risk Profile Capacity</span>
                    <Compass className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Current</div>
                      <div className="text-lg font-bold text-amber-300">{twin.current_risk_level}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-cyan-300 font-semibold uppercase">{activeTab.toUpperCase()} Future</div>
                      <div className="text-xl font-extrabold text-cyan-400">{selectedProj?.risk_level}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Investment Strategy</span>
                    <span className="font-semibold text-slate-600">
                      {selectedProj?.risk_level === 'High' ? 'Aggressive Growth' : selectedProj?.risk_level === 'Medium' ? 'Balanced SIP' : 'Capital Preserv.'}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>

          {/* Interactive Trajectory Visualization Chart */}
          <GlassCard className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Multi-Horizon Financial Twin Growth Trajectory
                </h3>
                <p className="text-xs text-slate-500">
                  Visualizing Credit Score, Monthly Savings, and Total Net Worth trajectory from Today to 5 Years.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Credit Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Net Worth (₹)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="horizon" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#10b981" domain={[300, 900]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Credit Score') return [value, 'Credit Score'];
                      return [`₹${Number(value).toLocaleString('en-IN')}`, name];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="creditScore"
                    name="Credit Score"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCredit)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="netWorth"
                    name="Net Worth"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorNetWorth)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Detailed 3-Horizon Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1 Year Horizon */}
            <GlassCard className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-display font-bold text-slate-900 text-base">1 Year Horizon</span>
                <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Near Term</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Credit Score</span>
                  <span className="font-bold text-emerald-300">{twin.projection_1y.credit_score} pts</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Monthly Savings</span>
                  <span className="font-bold text-slate-700">₹{twin.projection_1y.savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Investment Value</span>
                  <span className="font-bold text-teal-300">₹{twin.projection_1y.investment_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Net Worth</span>
                  <span className="font-bold text-emerald-400">₹{twin.projection_1y.net_worth.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Future Risk Profile</span>
                  <span className="font-bold text-amber-300">{twin.projection_1y.risk_level}</span>
                </div>
              </div>
            </GlassCard>

            {/* 3 Years Horizon */}
            <GlassCard className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-display font-bold text-slate-900 text-base">3 Years Horizon</span>
                <span className="text-[10px] font-bold uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">Mid Term</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Credit Score</span>
                  <span className="font-bold text-emerald-300">{twin.projection_3y.credit_score} pts</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Monthly Savings</span>
                  <span className="font-bold text-slate-700">₹{twin.projection_3y.savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Investment Value</span>
                  <span className="font-bold text-teal-300">₹{twin.projection_3y.investment_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Net Worth</span>
                  <span className="font-bold text-emerald-400">₹{twin.projection_3y.net_worth.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Future Risk Profile</span>
                  <span className="font-bold text-amber-300">{twin.projection_3y.risk_level}</span>
                </div>
              </div>
            </GlassCard>

            {/* 5 Years Horizon */}
            <GlassCard className="space-y-3 border-emerald-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-display font-bold text-slate-900 text-base">5 Years Horizon</span>
                <span className="text-[10px] font-bold uppercase bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded">Long Term</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Credit Score</span>
                  <span className="font-bold text-emerald-300">{twin.projection_5y.credit_score} pts</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Monthly Savings</span>
                  <span className="font-bold text-slate-700">₹{twin.projection_5y.savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Investment Value</span>
                  <span className="font-bold text-teal-300">₹{twin.projection_5y.investment_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Future Net Worth</span>
                  <span className="font-bold text-emerald-400">₹{twin.projection_5y.net_worth.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Future Risk Profile</span>
                  <span className="font-bold text-amber-300">{twin.projection_5y.risk_level}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
};
