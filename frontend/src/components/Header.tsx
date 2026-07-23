import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Compass, TrendingUp, Users, LogOut, User as UserIcon, Sparkles, ShieldAlert, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { ContactModal } from './ContactModal';

interface HeaderProps {
  onOpenContact?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenContact }) => {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [internalContactOpen, setInternalContactOpen] = useState(false);

  const handleContactClick = () => {
    if (onOpenContact) {
      onOpenContact();
    } else {
      setInternalContactOpen(true);
    }
  };

  const userNavItems = [
    { label: 'User Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Credit Score', path: '/credit-score', icon: CreditCard },
    { label: 'Risk Profiler', path: '/risk-profiler', icon: Compass },
    { label: 'Investment Plan', path: '/investment-plan', icon: TrendingUp },
    { label: 'Financial Twin', path: '/financial-twin', icon: Sparkles, badge: 'AI' },
    { label: 'Sample Users', path: '/sample-users', icon: Users },
  ];

  const adminNavItems = [
    { label: '👑 Admin Control Desk', path: '/admin', icon: ShieldAlert, badge: 'ADMIN' },
    { label: 'Consented User Directory', path: '/sample-users', icon: Users },
    { label: 'Reports Archive', path: '/reports', icon: CreditCard },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      <header className="border-b border-red-900/60 bg-gradient-to-r from-red-950 via-slate-950 to-red-950 text-white backdrop-blur-2xl sticky top-0 z-30 shadow-xl shadow-red-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Logo size="md" />
          </Link>

          {/* Navigation Bar - Red & Yellow High Contrast */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-red-900/40 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/40 border border-amber-400/40 scale-100'
                      : 'text-slate-200 hover:text-amber-300 hover:bg-red-950/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      item.badge === 'ADMIN'
                        ? 'bg-amber-400 text-slate-950 border border-amber-300'
                        : 'bg-red-500/30 text-amber-300 border border-amber-400/40'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Admin Switcher / Login Shortcut */}
            {!isAdmin && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                title="Switch to Password Protected Admin Portal"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Portal 👑</span>
              </Link>
            )}

            {/* Contact Us Button - Yellow/Gold Theme */}
            <button
              onClick={handleContactClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 border border-amber-300 transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.03]"
              title="Contact Support & Helpdesk (+91 1800-123-4567)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-950" />
              <span>Contact Us</span>
            </button>

            {/* Auth / User controls */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-red-900/40 text-xs text-white">
                  <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">{user?.username}</span>
                  {user?.role === 'ADMIN' && (
                    <span className="text-[9px] font-extrabold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300">
                      ADMIN
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-red-400 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-amber-300 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-lg shadow-red-600/30 border border-red-400/30"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Internal Modal fallback */}
      <ContactModal isOpen={internalContactOpen} onClose={() => setInternalContactOpen(false)} />
    </>
  );
};
