import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { CreditScoreRequest, api } from '../api/client';

interface CreditSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: CreditScoreRequest;
}

interface SimulationResult {
  old_score: number;
  new_score: number;
  delta: number;
  explanation: string;
}

export const CreditSimulatorModal: React.FC<CreditSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialValues,
}) => {
  const [values, setValues] = useState<CreditScoreRequest>(initialValues);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = (key: keyof CreditScoreRequest, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const runSimulation = async (currentValues: CreditScoreRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<SimulationResult>('/simulate', currentValues);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to simulate credit score.');
    } finally {
      setLoading(false);
    }
  };

  // Run simulation whenever values change with a 300ms debounce
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      runSimulation(values);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [values, isOpen]);

  // Load initial simulation on open
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      runSimulation(initialValues);
    }
  }, [isOpen, initialValues]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-[#0B1120] border border-[#1F2937] rounded-2xl p-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-200 flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Interactive AI What-If Simulator</h2>
                  <p className="text-xs text-slate-500">Drag sliders to instantly calculate simulated score & AI impact suggestions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sliders Grid */}
            <div className="py-6 space-y-5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">Bill Payment Regularity (%)</span>
                  <span className="text-emerald-400 font-mono">{values.bill_payment_regularity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={values.bill_payment_regularity}
                  onChange={(e) => handleSliderChange('bill_payment_regularity', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-50 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">Mobile Recharge Frequency (/mo)</span>
                  <span className="text-emerald-400 font-mono">{values.recharge_frequency}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={values.recharge_frequency}
                  onChange={(e) => handleSliderChange('recharge_frequency', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-50 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">UPI Transaction Count (/mo)</span>
                  <span className="text-emerald-400 font-mono">{values.upi_transaction_count}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={values.upi_transaction_count}
                  onChange={(e) => handleSliderChange('upi_transaction_count', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-50 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">Monthly Savings Rate (%)</span>
                  <span className="text-emerald-400 font-mono">{values.monthly_savings_pct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={values.monthly_savings_pct}
                  onChange={(e) => handleSliderChange('monthly_savings_pct', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-50 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">Bank Balance Stability (0-100)</span>
                  <span className="text-emerald-400 font-mono">{values.bank_balance_stability}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={values.bank_balance_stability}
                  onChange={(e) => handleSliderChange('bank_balance_stability', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-50 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Simulated Score Output (Side-by-Side) */}
            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Old Score */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Current Score</span>
                    <div className="font-display text-2xl font-bold text-slate-600 mt-1">{result.old_score}</div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center justify-center">
                    <div className="p-2.5 rounded-full bg-white border border-slate-200">
                      <ArrowRight className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>

                  {/* Simulated Score */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center relative overflow-hidden">
                    <span className="text-[10px] text-emerald-300 uppercase font-semibold">Simulated Score</span>
                    <div className="font-display text-2xl font-extrabold text-slate-900 mt-1 flex items-center justify-center gap-1">
                      {result.new_score}
                      <span
                        className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ml-1 ${
                          result.delta >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {result.delta >= 0 ? `+${result.delta}` : result.delta}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Explanation Sentence */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{result.explanation}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-300 text-xs flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {error}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
