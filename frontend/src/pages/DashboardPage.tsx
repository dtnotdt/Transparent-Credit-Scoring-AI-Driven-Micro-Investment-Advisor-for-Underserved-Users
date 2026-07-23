import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Compass,
  TrendingUp,
  Activity,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { HeroSlider } from '../components/HeroSlider';
import { ContactModal } from '../components/ContactModal';
import { api, DashboardResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#dc2626', '#f59e0b', '#eab308', '#b91c1c'];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [userConsent, setUserConsent] = useState(true);
  const [consentMsg, setConsentMsg] = useState<string | null>(null);

  const handleToggleConsent = () => {
    const nextState = !userConsent;
    setUserConsent(nextState);
    setConsentMsg(nextState ? 'Permission granted! Verified advisors can now reach out to offer micro-loans.' : 'Permission revoked! Your details are now hidden from external advisors.');
    setTimeout(() => setConsentMsg(null), 3000);
  };

  useEffect(() => {
    if (user) {
      api.get<DashboardResponse>(`/dashboard/${user.id}`)
        .then((res) => setData(res.data))
        .catch((err) => setError('Failed to load dashboard data.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleExportCSV = () => {
    if (!user) return;
    window.open(`${api.defaults.baseURL}/export-csv/${user.id}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!user) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const response = await api.get(`/report/${user.id}/pdf`, {
        responseType: 'blob',
      });

      const contentType = String(response.headers['content-type'] ?? '');
      if (!contentType.includes('pdf')) {
        const text = await (response.data as Blob).text();
        let detail = 'Failed to generate PDF report.';
        try {
          detail = JSON.parse(text).detail || detail;
        } catch {}
        setPdfError(detail);
        return;
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TetraScore_Report_User_${user.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setPdfError(err.response?.data?.detail || 'Error downloading PDF report.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full" />
        <span className="mt-3 text-xs text-slate-500 font-medium">Loading Dashboard Data...</span>
      </div>
    );
  }

  const scorePercent = data?.latest_credit_score
    ? Math.min(100, Math.max(0, ((data.latest_credit_score - 300) / (900 - 300)) * 100))
    : 0;

  const pieData = data?.latest_allocation
    ? Object.entries(data.latest_allocation).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Premium Bank Hero Carousel Slider Banner */}
      <HeroSlider onOpenContact={() => setIsContactOpen(true)} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Welcome back, <span className="text-red-600 font-extrabold">{user?.username || 'Guest'}</span> 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empowering underserved and credit-invisible users through explainable AI.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-red-600" />
              Export History CSV
            </button>
            <button
              id="download-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-semibold border border-red-200 flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-amber-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-200" />
                  Download PDF Report
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* User Side Data Sharing & Outreach Consent Box */}
      <GlassCard className="bg-gradient-to-r from-slate-900 to-red-950 text-white border border-amber-500/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                🔒 Privacy & Data Sharing Controls
              </span>
              {userConsent ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  Consent Active (Consented User)
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  Consent Withheld (Private)
                </span>
              )}
            </div>
            <h3 className="font-display font-extrabold text-sm text-white">
              Allow Accredited Financial Advisors & Lenders to Contact Me
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When toggled ON, your credit rating and risk profile are visible to verified micro-finance partners on the Admin Portal so they can offer low-interest loans & advisory options. You can revoke permission anytime.
            </p>
          </div>

          <button
            onClick={handleToggleConsent}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md shrink-0 ${
              userConsent
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {userConsent ? '✅ Consent Granted (Click to Revoke)' : '🔒 Grant Permission to Contact'}
          </button>
        </div>

        {consentMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-amber-400/40 text-amber-300 text-xs font-semibold animate-fadeIn">
            {consentMsg}
          </div>
        )}
      </GlassCard>

      {pdfError && (
          <p className="text-xs text-red-400 mt-1">{pdfError}</p>
        )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard glow>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              Credit Score
            </span>
            <CreditCard className="w-4 h-4 text-red-600" />
          </div>

          {data?.latest_credit_score ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-slate-900">
                {data.latest_credit_score}
              </span>
              <span className="text-xs font-semibold text-red-600">
                {data.credit_score_label}
              </span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500">No assessment recorded yet.</p>
              <div className="mt-2">
                <Link
                  to="/credit-score"
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-500 font-bold"
                >
                  Take assessment <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              Risk Profile Tier
            </span>
            <Compass className="w-4 h-4 text-amber-500" />
          </div>

          {data?.latest_risk_level ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-slate-900">
                {data.latest_risk_level}
              </span>
              <span className="text-xs bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                Target SIP Active
              </span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500">No risk survey submitted.</p>
              <div className="mt-2">
                <Link
                  to="/risk-profiler"
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-500 font-bold"
                >
                  Take 8-Q profiler <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Platform Health Score</span>
            <Zap className="w-4 h-4 text-red-600 dark:text-amber-400" />
          </div>
          {data?.health_score ? (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-red-600 dark:text-amber-400">
                {data.health_score}
              </span>
              <span className="text-xs text-slate-500">/ 100 Composite</span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">Complete assessments to calculate</span>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          {data?.latest_allocation ? (
            <GlassCard>
              <h3 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                Current Portfolio Allocation
              </h3>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex justify-between text-xs">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-mono text-red-600 font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="text-center py-8">
              <p className="text-xs text-slate-500">No allocation plan active yet.</p>
              <Link
                to="/investment-plan"
                className="mt-3 inline-block px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
              >
                View Micro-Investment Plans
              </Link>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="font-display font-semibold text-slate-900 text-sm mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                to="/credit-score"
                className="p-3 rounded-xl bg-white/60 hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium transition-all"
              >
                Calculate Credit Score →
              </Link>
              <Link
                to="/risk-profiler"
                className="p-3 rounded-xl bg-white/60 hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium transition-all"
              >
                Risk Profiler Bot →
              </Link>
              <Link
                to="/investment-plan"
                className="p-3 rounded-xl bg-white/60 hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium transition-all"
              >
                SIP Growth Bands →
              </Link>
              <Link
                to="/sample-users"
                className="p-3 rounded-xl bg-white/60 hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium transition-all"
              >
                Synthetic Users Dataset →
              </Link>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <GlassCard>
            <h3 className="font-display font-semibold text-slate-900 text-base mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600 dark:text-amber-400" /> Actionable Recommendations
            </h3>
            {data?.suggestions && data.suggestions.length > 0 ? (
              <div className="space-y-3">
                {data.suggestions.map((sug, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No suggestions available.</p>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600 dark:text-amber-400" /> Activity History
            </h3>
            {data?.recent_activity && data.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {data.recent_activity.map((act, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between text-xs gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                      <span className="text-slate-700">{act.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No activity recorded yet.</p>
            )}
          </GlassCard>
        </div>
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};
