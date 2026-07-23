import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

/* ─── Inline SVG Icons ──────────────────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   RegisterPage — Premium FinTech Redesign (matches LoginPage aesthetic)
   All auth handlers are 100% identical to the previous implementation.
═══════════════════════════════════════════════════════════════════════════════ */
export const RegisterPage: React.FC = () => {
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [role, setRole]               = useState<'USER' | 'ADMIN'>('USER');
  const [adminSecret, setAdminSecret] = useState('tetrathon_admin_2026');
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
        role,
        admin_secret: role === 'ADMIN' ? adminSecret : undefined,
      });
      login(res.data.access_token, {
        id: res.data.user_id,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role || 'USER',
      });
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Try a different email/username.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'ADMIN';

  return (
    <>
      <style>{`
        .rp-fullscreen {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: #F8FAFC;
          overflow-y: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        .rp-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow:
            0 2px 4px rgba(109,94,248,0.06),
            0 8px 24px rgba(109,94,248,0.10),
            0 32px 64px rgba(109,94,248,0.08);
          padding: 44px 40px;
        }

        /* Header */
        .rp-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 28px;
          gap: 0;
        }
        .rp-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb, #0f172a);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          margin-bottom: 14px;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
        }
        .rp-title {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.4px;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        .rp-subtitle {
          font-size: 13px;
          color: #6B7280;
          line-height: 1.5;
        }

        /* Role toggle */
        .rp-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }
        .rp-role-btn {
          padding: 11px 8px;
          border-radius: 12px;
          border: 1.5px solid;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          text-align: center;
          outline: none;
        }
        .rp-role-user {
          border-color: rgba(37,99,235,0.25);
          color: #2563eb;
          background: rgba(37,99,235,0.04);
        }
        .rp-role-user.active {
          border-color: #2563eb;
          background: rgba(37,99,235,0.10);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }
        .rp-role-admin {
          border-color: rgba(217,119,6,0.25);
          color: #D97706;
          background: rgba(217,119,6,0.04);
        }
        .rp-role-admin.active {
          border-color: #D97706;
          background: rgba(217,119,6,0.10);
          box-shadow: 0 0 0 3px rgba(217,119,6,0.10);
        }

        /* Field */
        .rp-field { margin-bottom: 14px; }
        .rp-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          letter-spacing: 0.1px;
        }
        .rp-label-warn { color: #B45309; }
        .rp-input-wrap { position: relative; }
        .rp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .rp-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          background: #F9FAFB;
          color: #111827;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          box-sizing: border-box;
        }
        .rp-input::placeholder { color: #C9CDD4; }
        .rp-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        }
        .rp-input-warn:focus {
          border-color: #D97706;
          box-shadow: 0 0 0 3px rgba(217,119,6,0.12);
        }
        .rp-input-hint {
          font-size: 11px;
          color: #B45309;
          margin-top: 5px;
          line-height: 1.5;
        }
        .rp-input-hint code {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 10.5px;
          color: #92400E;
        }

        /* Admin secret panel */
        .rp-admin-panel {
          padding: 14px 16px;
          border-radius: 12px;
          background: #FFFBEB;
          border: 1.5px solid #FDE68A;
          margin-bottom: 14px;
        }
        .rp-admin-panel-title {
          font-size: 12px;
          font-weight: 700;
          color: #B45309;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Error */
        .rp-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 11px 14px;
          border-radius: 12px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #B91C1C;
          font-size: 12px;
          margin-bottom: 14px;
          line-height: 1.5;
        }
        .rp-error svg { flex-shrink: 0; margin-top: 1px; }

        /* Submit */
        .rp-submit-btn {
          width: 100%;
          padding: 13px 20px;
          border-radius: 14px;
          border: none;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.18s, box-shadow 0.18s, transform 0.12s;
          font-family: inherit;
          outline: none;
        }
        .rp-submit-btn-user {
          background: linear-gradient(135deg, #2563eb, #1e3a8a);
          box-shadow: 0 4px 14px rgba(37,99,235,0.35);
        }
        .rp-submit-btn-admin {
          background: linear-gradient(135deg, #D97706, #F59E0B);
          box-shadow: 0 4px 14px rgba(217,119,6,0.28);
        }
        .rp-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          opacity: 0.93;
        }
        .rp-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .rp-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        /* Spinner */
        .rp-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: rp-spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes rp-spin { to { transform: rotate(360deg); } }

        /* Footer */
        .rp-footer {
          text-align: center;
          font-size: 13px;
          color: #6B7280;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #F3F4F6;
        }
        .rp-footer a {
          color: #10b981;
          font-weight: 700;
          text-decoration: none;
        }
        .rp-footer a:hover { text-decoration: underline; }

        /* Responsive */
        @media (max-width: 540px) {
          .rp-card { padding: 32px 24px; border-radius: 20px; }
        }
        @media (max-width: 400px) {
          .rp-card { padding: 24px 18px; }
        }
      `}</style>

      <div className="rp-fullscreen" role="main">
        <div className="rp-card">

          {/* Header */}
          <div className="rp-header">
            <div className="rp-icon-wrap">
              <ShieldIcon />
            </div>
            <h1 className="rp-title">Create Account</h1>
            <p className="rp-subtitle">
              Join the transparent AI credit scoring platform
            </p>
          </div>

          {/* Role toggle */}
          <div className="rp-role-grid" role="group" aria-label="Account role selection">
            <button
              id="role-user-btn"
              type="button"
              onClick={() => setRole('USER')}
              className={`rp-role-btn rp-role-user${role === 'USER' ? ' active' : ''}`}
              aria-pressed={role === 'USER'}
            >
              👤 Standard User
            </button>
            <button
              id="role-admin-btn"
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`rp-role-btn rp-role-admin${role === 'ADMIN' ? ' active' : ''}`}
              aria-pressed={role === 'ADMIN'}
            >
              👑 Admin Role
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
            {/* Username */}
            <div className="rp-field">
              <label className="rp-label" htmlFor="reg-username">Username</label>
              <div className="rp-input-wrap">
                <span className="rp-input-icon"><UserIcon /></span>
                <input
                  id="reg-username"
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="rp-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email */}
            <div className="rp-field">
              <label className="rp-label" htmlFor="reg-email">Email Address</label>
              <div className="rp-input-wrap">
                <span className="rp-input-icon"><MailIcon /></span>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="rp-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="rp-field">
              <label className="rp-label" htmlFor="reg-password">Password (min 8 characters)</label>
              <div className="rp-input-wrap">
                <span className="rp-input-icon"><LockIcon /></span>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rp-input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Admin secret (conditional) */}
            {isAdmin && (
              <div className="rp-admin-panel">
                <div className="rp-admin-panel-title">
                  <KeyIcon />
                  Admin Provisioning Secret
                </div>
                <div className="rp-input-wrap">
                  <span className="rp-input-icon" style={{ color: '#B45309' }}><KeyIcon /></span>
                  <input
                    id="reg-admin-secret"
                    type="password"
                    required
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="tetrathon_admin_2026"
                    className="rp-input rp-input-warn"
                    autoComplete="off"
                  />
                </div>
                <p className="rp-input-hint">
                  Default: <code>tetrathon_admin_2026</code>
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rp-error" role="alert" aria-live="polite">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className={`rp-submit-btn ${isAdmin ? 'rp-submit-btn-admin' : 'rp-submit-btn-user'}`}
            >
              {loading ? (
                <><span className="rp-spinner" aria-hidden="true" />Creating Account…</>
              ) : (
                `Register as ${isAdmin ? 'Admin' : 'User'}`
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="rp-footer">
            Already have an account?{' '}
            <Link to="/login" id="signin-link">Sign in here</Link>
          </div>
        </div>
      </div>
    </>
  );
};
