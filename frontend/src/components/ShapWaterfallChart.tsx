import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { DetailedShapFeature } from '../api/client';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface ShapWaterfallChartProps {
  features: DetailedShapFeature[];
  summaryHeadline: string;
  baseValue: number;
  finalScore: number;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  features,
  summaryHeadline,
  baseValue,
  finalScore,
}) => {
  // Format data for horizontal bar chart
  const data = features.map((f) => ({
    name: f.feature_name,
    impact: f.shap_value,
    direction: f.direction,
    explanation: f.english_explanation,
    val: f.user_value,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Sentence Header */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider mb-1">
          <Info className="w-4 h-4 text-indigo-400" />
          SHAP Driver Analysis
        </div>
        <p className="text-slate-900 font-display text-sm font-semibold leading-snug">
          {summaryHeadline}
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-mono">
          <span>Base Model Value: <strong className="text-slate-700">{baseValue} pts</strong></span>
          <span>→</span>
          <span>Your Final Score: <strong className="text-indigo-400">{finalScore} pts</strong></span>
        </div>
      </div>

      {/* Horizontal Bar Chart (Green = Helps, Red = Hurts) */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#cbd5e1"
              fontSize={11}
              width={140}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              formatter={(value: any) => [
                `${Number(value) >= 0 ? '+' : ''}${value} points`,
                'SHAP Impact',
              ]}
            />
            <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
            <Bar dataKey="impact" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.impact >= 0 ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Plain-English Explanations List */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Feature-by-Feature Explanations
        </h4>
        <div className="space-y-2">
          {features.map((f) => (
            <div
              key={f.feature}
              className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                f.direction === 'helps'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-200'
                  : 'bg-rose-50 border-rose-200 text-rose-200'
              }`}
            >
              {f.direction === 'helps' ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>{f.feature_name}</span>
                  <span className="font-mono">
                    {f.shap_value >= 0 ? `+${f.shap_value}` : f.shap_value} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {f.english_explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
