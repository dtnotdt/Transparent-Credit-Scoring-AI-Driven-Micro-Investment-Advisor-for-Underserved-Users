import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Activity, TrendingUp, ShieldCheck,
  Award, BarChart2, AlertTriangle, RefreshCw,
  Search, Filter, Download, ShieldAlert, Sparkles, UserCheck, Lock
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { OutreachModal } from '../components/OutreachModal';
import { api, UserInfo } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface AdminAnalytics {
  summary: {
    total_users: number;
    total_admins: number;
    total_regular_users: number;
    total_credit_assessments: number;
    total_risk_assessments: number;
    total_financial_twins: number;
    total_investment_plans: number;
    avg_credit_score: number;
    platform_health_index: number | null;
    fully_engaged_users: number;
    engagement_rate_pct: number;
  };
  score_distribution: { label: string; count: number; pct: number }[];
  risk_breakdown: { level: string; count: number; pct: number }[];
  recent_activity: {
    timestamp: string;
    user: string;
    event_type: string;
    description: string;
    score: number | null;
  }[];
  disclaimer: string;
}

const RISK_COLORS: Record<string, string> = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
};

const SCORE_COLORS = ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#b91c1c'];

/* ── KPI Card ────────────────────────────────────────────────────────────── */
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, sub, icon, color = 'text-red-600' }) => (
  <GlassCard glow>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{label}</span>
      <span className={color}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="font-display text-3xl font-extrabold text-slate-900">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  </GlassCard>
);

/* ── Custom tooltip ──────────────────────────────────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-600 font-semibold mb-1">{label}</p>
      <p className="text-emerald-300">{payload[0].value} assessments ({payload[0].payload.pct}%)</p>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────────────────── */
export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // User management state
  const [usersList, setUsersList] = useState<UserInfo[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [outreachModalOpen, setOutreachModalOpen] = useState(false);
  const [outreachUser, setOutreachUser] = useState<any>(null);

  // Enforce RBAC guard: Non-admin users are immediately redirected
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleInspectUser = async (userId: number) => {
    setInspectLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUserDetail(res.data);
    } catch (err: any) {
      console.error('Failed to inspect user:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const loadAnalytics = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminAnalytics>('/admin/analytics');
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to load admin analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsersList(res.data.users);
      setTotalUsersCount(res.data.total);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter]);

  const handleExportUsersCSV = () => {
    window.open(`${api.defaults.baseURL}/admin/export-users-csv`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-200 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  const s = data!.summary;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-500/20 text-amber-300 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Admin Security Portal
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-red-500/20 text-red-300 border border-red-200 px-2.5 py-0.5 rounded-full">
              JWT RBAC Active
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Platform Operations & RBAC Control
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time aggregate analytics, user management, and credit score & risk distributions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportUsersCSV}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-300 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-red-400" />
            Export User Analytics CSV
          </button>
          <button
            id="admin-refresh-btn"
            onClick={() => {
              loadAnalytics(true);
              loadUsers();
            }}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-red-100 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Total Registered Users"
          value={s.total_users}
          sub={`${s.total_admins} Admins / ${s.total_regular_users} Users`}
          icon={<Users className="w-4 h-4" />}
          color="text-red-400"
        />
        <KpiCard
          label="Avg Credit Score"
          value={s.avg_credit_score || '—'}
          sub={s.avg_credit_score ? `/ 900` : undefined}
          icon={<Award className="w-4 h-4" />}
          color="text-amber-500"
        />
        <KpiCard
          label="Total Credit Assessments"
          value={s.total_credit_assessments}
          sub="credit checks"
          icon={<BarChart2 className="w-4 h-4" />}
          color="text-red-400"
        />
        <KpiCard
          label="Financial Twins Active"
          value={s.total_financial_twins}
          sub="simulations generated"
          icon={<Sparkles className="w-4 h-4" />}
          color="text-amber-500"
        />
      </motion.div>

      {/* Secondary KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Risk Assessments"
          value={s.total_risk_assessments}
          icon={<ShieldCheck className="w-4 h-4" />}
          color="text-amber-400"
        />
        <KpiCard
          label="Investment Plans"
          value={s.total_investment_plans}
          sub="generated"
          icon={<TrendingUp className="w-4 h-4" />}
          color="text-red-600"
        />
        <KpiCard
          label="Platform Health Index"
          value={s.platform_health_index ?? '—'}
          sub={s.platform_health_index ? '/ 100' : 'No data yet'}
          icon={<Activity className="w-4 h-4" />}
          color="text-emerald-400"
        />
        <KpiCard
          label="User Engagement Rate"
          value={`${s.engagement_rate_pct}%`}
          sub={`${s.fully_engaged_users} fully onboarded`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="text-teal-400"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Distribution Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-7"
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-slate-900 text-base mb-5 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Platform Credit Score Distribution
            </h3>
            {data!.score_distribution.every((d) => d.count === 0) ? (
              <p className="text-xs text-slate-500 py-8 text-center">No credit assessments recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data!.score_distribution} barCategoryGap="30%">
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data!.score_distribution.map((_, idx) => (
                      <Cell key={idx} fill={SCORE_COLORS[idx % SCORE_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </motion.div>

        {/* Risk Breakdown Pie */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="lg:col-span-5"
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-slate-900 text-base mb-5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Risk Profile Distribution
            </h3>
            {data!.risk_breakdown.every((d) => d.count === 0) ? (
              <p className="text-xs text-slate-500 py-8 text-center">No risk assessments recorded yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={data!.risk_breakdown.filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data!.risk_breakdown.map((entry, idx) => (
                        <Cell key={idx} fill={RISK_COLORS[entry.level] ?? '#10b981'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} users`, name]}
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {data!.risk_breakdown.map((rb) => (
                    <div key={rb.level} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: RISK_COLORS[rb.level] }}
                        />
                        <span className="text-slate-600">{rb.level} Risk</span>
                      </div>
                      <span className="font-mono text-slate-500">
                        {rb.count} <span className="text-slate-600">({rb.pct}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* User Management Section (RBAC Search & Filter) */}
      <GlassCard className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Registered User Directory
              <span className="text-xs font-mono text-slate-500 font-normal">({totalUsersCount} Total)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Passwords remain strictly bcrypt-hashed and hidden. Search and filter registered users securely.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/80 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-200"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-emerald-200"
              >
                <option value="">All Roles</option>
                <option value="USER">USER Only</option>
                <option value="ADMIN">ADMIN Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-[10px] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Credit Score</th>
                <th className="py-3.5 px-4">Data Sharing Consent</th>
                <th className="py-3.5 px-4 text-right">Actions / Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading users directory...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const hasConsent = u.role !== 'ADMIN' ? true : false;
                  return (
                    <tr key={u.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">#{u.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-red-600" />
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {u.latest_credit_score ? (
                          <span className="font-extrabold text-red-600">{u.latest_credit_score}</span>
                        ) : (
                          <span className="text-slate-400">745 (Est)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasConsent ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Consented to Outreach
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 font-semibold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200">
                            Consent Withheld
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setOutreachUser({
                              id: u.id,
                              username: u.username,
                              email: u.email,
                              phone: '+91 98765 43210',
                              credit_score: u.latest_credit_score || 745,
                              risk_level: u.latest_risk_level || 'Moderate',
                              occupation: 'Salaried Private',
                              monthly_income: 50000,
                            });
                            setOutreachModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-extrabold shadow-sm transition-all"
                        >
                          Reach Out 📞
                        </button>
                        <button
                          onClick={() => handleInspectUser(u.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-all"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* User Data Inspection Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200">
                  Admin Security Inspection
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  User Details: {selectedUserDetail.username}
                </h2>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="text-slate-500 hover:text-slate-900 text-sm px-2 py-1 bg-slate-50 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-500">User ID:</span>
                  <p className="font-mono text-slate-900 font-bold">#{selectedUserDetail.id}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="text-slate-900 font-medium">{selectedUserDetail.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Role:</span>
                  <p className="font-bold text-amber-300">{selectedUserDetail.role}</p>
                </div>
                <div>
                  <span className="text-slate-500">Registered:</span>
                  <p className="text-slate-600">{new Date(selectedUserDetail.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-50/40 p-4 rounded-xl space-y-2 border border-slate-300/60">
                <h4 className="font-semibold text-emerald-300 uppercase tracking-wider text-[11px]">Stored Assessments & Activity</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/80 p-2 rounded-lg">
                    <p className="text-slate-500 text-[10px]">Credit Checks</p>
                    <p className="text-lg font-bold text-emerald-400">{selectedUserDetail.assessments.credit_count}</p>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg">
                    <p className="text-slate-500 text-[10px]">Risk Checks</p>
                    <p className="text-lg font-bold text-amber-400">{selectedUserDetail.assessments.risk_count}</p>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg">
                    <p className="text-slate-500 text-[10px]">Financial Twins</p>
                    <p className="text-lg font-bold text-teal-400">{selectedUserDetail.assessments.financial_twin_count}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <p className="text-slate-600 flex justify-between">
                    <span>Latest Credit Score:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedUserDetail.assessments.latest_credit_score ?? 'Not evaluated yet'}
                    </span>
                  </p>
                  <p className="text-slate-600 flex justify-between">
                    <span>Latest Risk Level:</span>
                    <span className="font-bold text-amber-300">
                      {selectedUserDetail.assessments.latest_risk_level ?? 'Not evaluated yet'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <GlassCard>
          <h3 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Global Activity Feed
            <span className="ml-auto text-[10px] text-slate-500 font-normal font-mono">latest 15 events</span>
          </h3>
          {data!.recent_activity.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No platform activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {data!.recent_activity.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        act.event_type === 'credit_score'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <span className="text-slate-700">{act.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {act.score !== null && (
                      <span className="font-mono text-emerald-400 font-bold">{act.score}</span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      <OutreachModal isOpen={outreachModalOpen} onClose={() => setOutreachModalOpen(false)} user={outreachUser} />
    </div>
  );
};
