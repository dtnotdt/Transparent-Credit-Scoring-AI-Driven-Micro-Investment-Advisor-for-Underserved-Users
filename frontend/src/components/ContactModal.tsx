import React, { useState } from 'react';
import { X, Phone, Mail, Clock, MapPin, Send, CheckCircle2, MessageSquare, ShieldCheck, HelpCircle, PhoneCall } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'Credit Score Inquiry',
    message: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950 text-white rounded-3xl shadow-2xl border border-red-900/50 overflow-hidden">
        {/* Header — Red & Yellow Gradient */}
        <div className="bg-gradient-to-r from-red-700 via-red-900 to-amber-950 px-6 py-5 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 backdrop-blur border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-white tracking-tight">24/7 Indian Customer Support & Helpdesk</h3>
              <p className="text-xs text-amber-200">We are here to help you with your credit score, SHAP report & advisory queries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Indian Helpline Card */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-red-950/40 border border-amber-400/30 flex items-start gap-3.5 hover:border-amber-400 transition-all shadow-lg shadow-red-900/10">
              <div className="p-3 rounded-xl bg-red-600/20 text-amber-400 border border-amber-400/40">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">Indian Toll-Free Helpline</span>
                <p className="font-mono font-extrabold text-lg text-white mt-0.5 tracking-wide">+91 1800-123-4567</p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">+91 98765 43210 (Direct Assistance)</p>
              </div>
            </div>

            {/* Email Card */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-red-950/40 border border-slate-800 flex items-start gap-3.5 hover:border-amber-400/50 transition-all">
              <div className="p-3 rounded-xl bg-red-600/20 text-amber-400 border border-amber-400/40">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Support</span>
                <p className="font-medium text-sm text-amber-300 mt-0.5 hover:underline cursor-pointer">support@tetrascore.in</p>
                <p className="text-xs text-slate-400 mt-0.5">helpdesk@tetrascore.ai</p>
              </div>
            </div>

            {/* Support Hours Card */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-red-600/20 text-amber-400 border border-amber-400/40">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Support Hours</span>
                <p className="text-xs font-semibold text-white mt-0.5">24/7 Voice & AI Assistant Support</p>
                <p className="text-xs text-slate-400 mt-0.5">Mon - Sat: 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>

            {/* Indian Corporate Office */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-red-600/20 text-amber-400 border border-amber-400/40">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">India Head Office</span>
                <p className="text-xs font-semibold text-white mt-0.5">BKC FinTech Tower, Level 14</p>
                <p className="text-xs text-slate-400 mt-0.5">Bandra Kurla Complex, Mumbai 400051</p>
              </div>
            </div>
          </div>

          {/* Direct Message Form */}
          <div className="border-t border-slate-800 pt-5">
            <h4 className="font-display font-semibold text-sm text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Send Us a Quick Help Message
            </h4>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-red-950/60 border border-amber-400/40 text-center space-y-2 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto" />
                <h5 className="font-bold text-white text-base">Query Received Successfully!</h5>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Thank you for reaching out. Our support agent will call/email you back at ({formData.phone || formData.email || 'your contact details'}) shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Indian Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Inquiry Topic</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                    >
                      <option>Credit Score Inquiry</option>
                      <option>SHAP Feature Explanation</option>
                      <option>Risk Profiler Question</option>
                      <option>Micro Investment Assistance</option>
                      <option>Financial Twin Simulation</option>
                      <option>General Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">How can we help you?</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your issue or question..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>256-bit Encrypted SSL Security</span>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-extrabold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-950" />
                    Submit Support Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
