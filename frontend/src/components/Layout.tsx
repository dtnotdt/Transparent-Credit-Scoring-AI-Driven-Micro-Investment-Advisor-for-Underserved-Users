import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ComplianceBanner } from './ComplianceBanner';
import { ChatbotWidget } from './ChatbotWidget';
import { ContactModal } from './ContactModal';
import { Logo } from './Logo';
import { Phone, Mail, Clock, HelpCircle, ShieldCheck, MapPin } from 'lucide-react';

export const Layout: React.FC = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 relative overflow-x-hidden font-sans selection:bg-red-600 selection:text-white">
      {/* Background ambient lighting blobs — Ultra Crisp Pure White Theme */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed bottom-0 right-1/4 w-[700px] h-[700px] bg-amber-400/5 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Compliance Banner */}
      <ComplianceBanner />

      {/* Header Navigation */}
      <Header onOpenContact={() => setIsContactOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Ultra-Premium Red & Yellow Footer with Indian Helpline Details & Logo */}
      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300 py-12 text-xs relative backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-slate-800">
            {/* Col 1: Brand & Logo */}
            <div className="space-y-4">
              <Logo size="lg" />
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Next-generation AI credit scoring & micro-investment platform evaluating non-traditional financial footprints to empower underserved users across emerging markets.
              </p>
              <div className="flex items-center gap-2 text-slate-300 text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800 w-fit">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Explainable AI Engine • SHAP Feature TreeExplainer</span>
              </div>
            </div>

            {/* Col 2: Indian Help & Contact Details */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-amber-400 text-xs tracking-wider uppercase">India Customer Support</h4>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-600/20 border border-amber-400/40 text-amber-400 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Toll-Free Indian Helpline</span>
                    <span className="font-mono font-extrabold text-white text-sm tracking-wide">+91 1800-123-4567</span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">+91 98765 43210 (Direct Support)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-600/20 border border-amber-400/40 text-amber-400 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Official Email</span>
                    <span className="font-medium text-amber-300 hover:underline cursor-pointer">support@tetrascore.in</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-600/20 border border-amber-400/40 text-amber-400 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Corporate Office</span>
                    <span className="text-slate-300 text-xs">BKC FinTech Tower, Level 14, BKC, Mumbai 400051</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact Action Button */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-amber-400 text-xs tracking-wider uppercase">Need Assistance?</h4>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Have questions regarding your alternative credit score or financial twin projections? Connect directly with our Indian support team.
                </p>
              </div>
              <button
                onClick={() => setIsContactOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-amber-500/20 border border-amber-300 hover:scale-[1.02]"
              >
                <HelpCircle className="w-4 h-4 text-slate-950" />
                <span>Contact Us For Help</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <p>© 2026 TetraScore FinTech Advisory — Built for Financial Inclusion</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-amber-300 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-amber-300 cursor-pointer">Terms of Service</span>
              <span>•</span>
              <span className="hover:text-amber-300 cursor-pointer">Security & Compliance</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Embedded Chatbot Launcher */}
      <ChatbotWidget />

      {/* Contact Modal */}
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};
