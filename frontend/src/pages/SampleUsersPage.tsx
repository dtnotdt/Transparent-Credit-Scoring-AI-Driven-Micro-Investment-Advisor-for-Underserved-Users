import React, { useEffect, useState } from 'react';
import { Users, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api, SampleUser, SampleUsersResponse } from '../api/client';

export const SampleUsersPage: React.FC = () => {
  const [users, setUsers] = useState<SampleUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<SampleUsersResponse>(`/sample-users?page=${page}&page_size=15`)
      .then((res) => {
        setUsers(res.data.users);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-200 text-red-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Synthetic Dataset Explorer
            </h1>
            <p className="text-slate-500 text-sm">
              1,200 correlated credit-invisible user profiles for ML training & demonstration
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Total Users: <span className="text-red-600 font-bold">{total}</span>
        </div>
      </div>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 uppercase font-bold">
              <th className="p-3.5">User ID</th>
              <th className="p-3.5">Occupation</th>
              <th className="p-3.5 font-mono">Monthly Income</th>
              <th className="p-3.5">Bill Payment %</th>
              <th className="p-3.5">UPI Count</th>
              <th className="p-3.5">Savings %</th>
              <th className="p-3.5">CIBIL Score</th>
              <th className="p-3.5">Risk Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading sample dataset...
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="hover:bg-red-50/30 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">#{u.user_id}</td>
                  <td className="p-3.5 font-medium">{u.occupation}</td>
                  <td className="p-3.5 font-mono text-slate-900">₹{u.monthly_income?.toLocaleString()}</td>
                  <td className="p-3.5 font-mono text-slate-900">{u.bill_payment_regularity}%</td>
                  <td className="p-3.5 font-mono text-slate-900">{u.upi_transaction_count}</td>
                  <td className="p-3.5 font-mono text-slate-900">{u.monthly_savings_pct}%</td>
                  <td className="p-3.5">
                    <span className="font-mono font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {u.calculated_score || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {u.risk_tier || 'Moderate'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
