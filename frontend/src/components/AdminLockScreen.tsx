import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const AdminLockScreen: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', {
        email: 'admin@tetrascore.in',
        password: password,
      });
      login(res.data.access_token, {
        id: res.data.user_id,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role || 'ADMIN',
      });
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid Admin Password. Please enter the demo password "admin123".');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-slate-950 text-white border border-red-900/60 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl text-white">🔒 Admin Portal Password Protected</h2>
          <p className="text-xs text-amber-200">Authorized Financial Administrators & Lenders Only</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
        <div className="font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-amber-400" /> Demo Admin Access Credentials
        </div>
        <div className="font-mono text-slate-300 space-y-1">
          <p>Email: <strong className="text-white">admin@tetrascore.in</strong></p>
          <p>Password: <strong className="text-amber-300">admin123</strong></p>
        </div>
      </div>

      <form onSubmit={handleAdminUnlock} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enter Admin Password</label>
          <input
            type="password"
            required
            placeholder="Type admin123 to unlock..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-400 outline-none font-mono"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>Unlocking Admin Access...</span>
            ) : (
              <>
                <span>Authenticate Admin</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
