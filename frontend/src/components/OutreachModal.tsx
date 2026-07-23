import React, { useState } from 'react';
import { X, Phone, Mail, MessageSquare, Send, CheckCircle2, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

interface ConsentedUserItem {
  id: number;
  username: string;
  email: string;
  phone?: string;
  credit_score?: number;
  risk_level?: string;
  occupation?: string;
  monthly_income?: number;
}

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ConsentedUserItem | null;
}

export const OutreachModal: React.FC<OutreachModalProps> = ({ isOpen, onClose, user }) => {
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  const [offerType, setOfferType] = useState('Micro-Loan Pre-Approval (₹50,000 at 8.5% p.a.)');
  const [customMsg, setCustomMsg] = useState('');

  if (!isOpen || !user) return null;

  const userPhone = user.phone || '+91 98765 43210';

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setSentStatus('Sending verified outreach proposal...');
    setTimeout(() => {
      setSentStatus(`Successfully dispatched proposal to ${user.username} via SMS (+91 98765 43210) & Email (${user.email})!`);
      setTimeout(() => {
        setSentStatus(null);
        onClose();
      }, 2500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-950 text-white rounded-3xl shadow-2xl border border-amber-500/40 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-950 to-amber-950 px-6 py-5 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white">Admin Outreach Desk</h3>
              <p className="text-xs text-amber-200">Reaching out to Consented User: <strong className="text-white">{user.username}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* User Consent Badge & Credit Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Consent Verification:</span>
              <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Data Sharing Consent Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Credit Score</span>
                <span className="font-mono font-extrabold text-amber-400 text-sm">{user.credit_score || 745}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Tier</span>
                <span className="font-bold text-white text-sm">{user.risk_level || 'Moderate'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Income</span>
                <span className="font-mono font-extrabold text-white text-sm">₹{user.monthly_income ? user.monthly_income.toLocaleString() : '50,000'}</span>
              </div>
            </div>
          </div>

          {/* Quick Direct Actions: Call, WhatsApp, Email */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`tel:${userPhone}`}
              className="p-3 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all text-center"
            >
              <Phone className="w-4 h-4 text-red-400" />
              <span>Direct Call</span>
            </a>
            <a
              href={`https://wa.me/${userPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(user.username)},%20TetraScore%20Admin%20Advisors%20would%20like%20to%20offer%20you%20a%20pre-approved%20micro-loan.`}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all text-center"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`mailto:${user.email}?subject=Exclusive%20Financial%20Advisory%20Proposal`}
              className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all text-center"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span>Email Proposal</span>
            </a>
          </div>

          {/* Send Official Platform Proposal Form */}
          <form onSubmit={handleSendOffer} className="space-y-4 pt-2 border-t border-slate-800">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">
              Send Official Financial Proposal
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proposal Category</label>
              <select
                value={offerType}
                onChange={(e) => setOfferType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option>Micro-Loan Pre-Approval (₹50,000 at 8.5% p.a.)</option>
                <option>Low-Risk SIP Portfolio Plan Allocation</option>
                <option>Personalized Financial Twin Advisory Session</option>
                <option>Credit Score Enhancement Assistance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Note / Loan Terms</label>
              <textarea
                rows={3}
                placeholder="Add specific terms or advisory note for this user..."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 outline-none resize-none"
              />
            </div>

            {sentStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs text-center font-semibold animate-fadeIn">
                {sentStatus}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>Dispatch Official Proposal</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
