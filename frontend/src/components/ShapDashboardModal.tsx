import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ShapWaterfallChart } from './ShapWaterfallChart';
import { api, ShapExplanationResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ShapDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export const ShapDashboardModal: React.FC<ShapDashboardModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [data, setData] = useState<ShapExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShapData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ShapExplanationResponse>(`/explain/${userId}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load detailed SHAP explanation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchShapData();
    }
  }, [isOpen, userId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl bg-[#0b0c16] border border-slate-300/80 rounded-2xl p-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-200 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900">SHAP Explanation Dashboard</h2>
                  <p className="text-xs text-slate-500">Explainable AI feature contribution model metrics</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                  Computing SHAP values from TreeExplainer...
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {error}
                </div>
              ) : data ? (
                <ShapWaterfallChart
                  features={data.features}
                  summaryHeadline={data.summary_headline}
                  baseValue={data.base_value}
                  finalScore={data.final_score}
                />
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
