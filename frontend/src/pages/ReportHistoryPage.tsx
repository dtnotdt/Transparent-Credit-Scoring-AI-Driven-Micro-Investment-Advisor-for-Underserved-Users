import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck, UserCheck, Search, Filter } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { api, DashboardResponse } from '../api/client';

export const ReportHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      api.get<DashboardResponse>(`/dashboard/${user.id}`)
        .then((res) => setData(res.data))
        .catch(() => setError('Failed to load assessment report history.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDownloadPDF = async (reportId: number) => {
    if (!user) return;
    setDownloadingId(reportId);
    setError(null);
    try {
      const response = await api.get(`/report/${user.id}/pdf`, {
        responseType: 'blob',
      });
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
      setError(err.response?.data?.detail || 'Failed to download report PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-200 text-red-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Assessment Report Archive
            </h1>
            <p className="text-slate-500 text-sm">
              Historical PDF audit trails & SHAP feature decision reports
            </p>
          </div>
        </div>
      </div>

      <GlassCard>
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading assessment logs...
          </div>
        ) : data?.latest_credit_score ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-600/10 border border-red-200 text-red-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Latest Comprehensive Credit Assessment Report
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    Score: {data.latest_credit_score} ({data.credit_score_label}) • Risk: {data.latest_risk_level || 'Moderate'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadPDF(user?.id || 1)}
                disabled={downloadingId === user?.id}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                {downloadingId === user?.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Download className="w-4 h-4 text-amber-300" />
                )}
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-display font-bold text-slate-900 text-sm">No Credit Reports Recorded</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Complete your first Credit Assessment to generate an exportable PDF report.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
