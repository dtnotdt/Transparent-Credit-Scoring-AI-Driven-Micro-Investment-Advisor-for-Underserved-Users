import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

/* ─── Inline SVG Icons ──────────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="7" fill="rgba(109,94,248,0.18)" />
    <path d="M4 7l2 2 4-4" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9c-.6-1.2-1-2.6-1-4z" />
    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
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

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/* ─── Feature list ───────────────────────────────────────────────────────────── */
const FEATURES = [
  'SHAP Powered Explainability',
  'Financial Twin AI',
  'Transparent Credit Score',
  'Secure Authentication',
  'English • Hindi • Gujarati',
  'Educational Purpose',
];

/* ═══════════════════════════════════════════════════════════════════════════════
   LoginPage — Premium FinTech Redesign
   All auth handlers are identical to the previous implementation.
   Only the visual layer changed.
═══════════════════════════════════════════════════════════════════════════════ */
export const LoginPage: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  /* ── Handle Google OAuth callback params ── */
  useEffect(() => {
    const params  = new URLSearchParams(location.search);
    const token   = params.get('token');
    const errParam = params.get('error');

    if (errParam) {
      setError(decodeURIComponent(errParam));
    } else if (token) {
      const userId   = parseInt(params.get('user_id') || '0', 10);
      const username = params.get('username') || '';
      const emailParam = params.get('email') || '';
      const role     = (params.get('role') || 'USER') as 'USER' | 'ADMIN';
      const prefLang = params.get('preferred_language') || 'en';
      if (prefLang) localStorage.setItem('preferred_language', prefLang);

      login(token, { id: userId, username, email: emailParam, role });
      navigate(role === 'ADMIN' ? '/admin' : '/');
    }
  }, [location.search, login, navigate]);

  /* ── Email / password sign-in ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.access_token, {
        id: res.data.user_id,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role || 'USER',
      });
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth redirect ── */
  const handleGoogleSignIn = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    window.location.href = `${apiBase}/api/v1/auth/google/login`;
  };

  /* ── Quick demo logins ── */
  const handleQuickLogin = async (
    demoEmail: string,
    demoUsername: string,
    demoRole: 'USER' | 'ADMIN',
  ) => {
    setLoading(true);
    setError(null);
    const demoPassword = demoRole === 'ADMIN' ? 'adminpass123' : 'securepass123';
    try {
      const res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      login(res.data.access_token, {
        id: res.data.user_id,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role || 'USER',
      });
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/');
    } catch {
      try {
        const regRes = await api.post('/auth/register', {
          username: demoUsername,
          email: demoEmail,
          password: demoPassword,
          role: demoRole,
          admin_secret: demoRole === 'ADMIN' ? 'tetrathon_admin_2026' : undefined,
        });
        login(regRes.data.access_token, {
          id: regRes.data.user_id,
          username: regRes.data.username,
          email: regRes.data.email,
          role: regRes.data.role || 'USER',
        });
        navigate(regRes.data.role === 'ADMIN' ? '/admin' : '/');
      } catch (regErr: any) {
        setError(regErr.response?.data?.detail || 'Quick login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Full-screen overlay that paints over the dark Layout background */}
      <style>{`
        /* ── Override dark layout for login route only ── */
        .login-fullscreen-override {
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

        /* ── Two-column card ── */
        .lp-card {
          width: 100%;
          max-width: 960px;
          min-height: 580px;
          border-radius: 24px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          box-shadow:
            0 2px 4px rgba(109,94,248,0.06),
            0 8px 24px rgba(109,94,248,0.10),
            0 32px 64px rgba(109,94,248,0.08);
        }

        /* ── LEFT: Gradient hero panel (Blue and Black theme) ── */
        .lp-left {
          background: linear-gradient(145deg, #090d16 0%, #1e3a8a 45%, #1d4ed8 75%, #2563eb 100%);
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          color: #fff;
        }

        /* Floating abstract circles — CSS only, no JS animation */
        .lp-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform;
        }
        .lp-circle-1 {
          width: 300px; height: 300px;
          background: rgba(255,255,255,0.06);
          top: -80px; right: -80px;
        }
        .lp-circle-2 {
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.05);
          bottom: -40px; left: -60px;
        }
        .lp-circle-3 {
          width: 120px; height: 120px;
          background: rgba(91,140,255,0.20);
          bottom: 80px; right: 40px;
        }
        .lp-circle-4 {
          width: 80px; height: 80px;
          background: rgba(255,255,255,0.08);
          top: 160px; left: 20px;
        }

        /* Logo */
        .lp-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }
        .lp-logo-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
        }
        .lp-logo-text {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #fff;
          line-height: 1;
        }
        .lp-logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.65);
          font-weight: 500;
          letter-spacing: 0.2px;
          margin-top: 2px;
        }

        /* Hero copy */
        .lp-hero {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 0;
        }
        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.20);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.90);
          width: fit-content;
          margin-bottom: 20px;
          backdrop-filter: blur(6px);
        }
        .lp-badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #34D399;
          box-shadow: 0 0 0 2px rgba(52,211,153,0.35);
        }
        .lp-headline {
          font-size: clamp(26px, 3.5vw, 34px);
          font-weight: 800;
          line-height: 1.2;
          color: #fff;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .lp-headline span {
          opacity: 0.82;
        }
        .lp-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.68);
          font-weight: 400;
          line-height: 1.6;
          margin-bottom: 28px;
          max-width: 340px;
        }

        /* Feature checklist */
        .lp-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lp-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.88);
        }
        .lp-feature-check {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lp-feature-check svg {
          width: 11px; height: 11px;
        }
        .lp-feature-check path {
          stroke: #fff;
        }
        .lp-feature-check circle {
          fill: transparent;
        }

        /* Left footer */
        .lp-left-footer {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.14);
          padding-top: 20px;
          font-size: 11px;
          color: rgba(255,255,255,0.50);
        }

        /* ── RIGHT: White glass form panel ── */
        .lp-right {
          background: #ffffff;
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0;
          position: relative;
        }

        .lp-form-title {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.4px;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        .lp-form-subtitle {
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        /* Google button */
        .lp-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          border-radius: 14px;
          border: 1.5px solid #E5E7EB;
          background: #fff;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          outline: none;
          text-decoration: none;
          font-family: inherit;
        }
        .lp-google-btn:hover:not(:disabled) {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(109,94,248,0.10), 0 2px 8px rgba(109,94,248,0.10);
          background: #FAFAFA;
        }
        .lp-google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Divider */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .lp-divider-line {
          flex: 1;
          height: 1px;
          background: #E5E7EB;
        }
        .lp-divider-text {
          font-size: 11px;
          font-weight: 600;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        /* Form fields */
        .lp-field {
          margin-bottom: 14px;
        }
        .lp-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          letter-spacing: 0.1px;
        }
        .lp-input-wrap {
          position: relative;
        }
        .lp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .lp-input {
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
        .lp-input::placeholder {
          color: #C9CDD4;
        }
        .lp-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        /* Forgot password */
        .lp-forgot {
          display: block;
          text-align: right;
          font-size: 11px;
          font-weight: 500;
          color: #2563eb;
          text-decoration: none;
          margin-top: -8px;
          margin-bottom: 14px;
        }
        .lp-forgot:hover {
          text-decoration: underline;
        }

        /* Error */
        .lp-error {
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
        .lp-error svg { flex-shrink: 0; margin-top: 1px; }

        /* Sign In button */
        .lp-submit-btn {
          width: 100%;
          padding: 13px 20px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.18s, box-shadow 0.18s, transform 0.12s;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.1px;
          outline: none;
        }
        .lp-submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
          transform: translateY(-1px);
        }
        .lp-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .lp-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        /* Spinner */
        .lp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lp-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        /* Demo + register bottom section */
        .lp-bottom {
          border-top: 1px solid #F3F4F6;
          padding-top: 18px;
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-demo-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .lp-demo-label {
          font-size: 11px;
          font-weight: 600;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          flex-shrink: 0;
        }
        .lp-demo-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 13px;
          border-radius: 100px;
          border: 1.5px solid;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
          font-family: inherit;
          background: transparent;
          outline: none;
        }
        .lp-demo-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .lp-demo-btn-user {
          color: #10b981;
          border-color: rgba(109,94,248,0.30);
        }
        .lp-demo-btn-user:hover:not(:disabled) {
          background: rgba(109,94,248,0.07);
          box-shadow: 0 0 0 2px rgba(109,94,248,0.12);
        }
        .lp-demo-btn-admin {
          color: #D97706;
          border-color: rgba(217,119,6,0.30);
        }
        .lp-demo-btn-admin:hover:not(:disabled) {
          background: rgba(217,119,6,0.07);
          box-shadow: 0 0 0 2px rgba(217,119,6,0.12);
        }

        .lp-register-row {
          text-align: center;
          font-size: 13px;
          color: #6B7280;
        }
        .lp-register-row a {
          color: #10b981;
          font-weight: 700;
          text-decoration: none;
        }
        .lp-register-row a:hover {
          text-decoration: underline;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .lp-card {
            grid-template-columns: 1fr;
            max-width: 480px;
            border-radius: 20px;
          }
          .lp-left {
            padding: 36px 32px;
            min-height: auto;
          }
          .lp-hero { padding: 24px 0; }
          .lp-circle-1 { width: 180px; height: 180px; top: -40px; right: -40px; }
          .lp-circle-2 { width: 120px; height: 120px; bottom: -20px; left: -30px; }
          .lp-circle-3 { display: none; }
          .lp-circle-4 { display: none; }
          .lp-right { padding: 36px 32px; }
          .lp-left-footer { display: none; }
        }

        @media (max-width: 480px) {
          .login-fullscreen-override { padding: 16px 12px; }
          .lp-left { padding: 28px 24px; }
          .lp-right { padding: 28px 24px; }
          .lp-headline { font-size: 24px; }
        }
      `}</style>

      <div className="login-fullscreen-override" role="main">
        <div className="lp-card">

          {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
          <div className="lp-left" aria-label="TetraScore brand panel">
            {/* Decorative floating circles */}
            <div className="lp-circle lp-circle-1" aria-hidden="true" />
            <div className="lp-circle lp-circle-2" aria-hidden="true" />
            <div className="lp-circle lp-circle-3" aria-hidden="true" />
            <div className="lp-circle lp-circle-4" aria-hidden="true" />

            {/* Logo */}
            <div className="lp-logo">
              <div className="lp-logo-icon">
                <ShieldIcon />
              </div>
              <div>
                <div className="lp-logo-text">TetraScore</div>
                <div className="lp-logo-sub">Explainable Credit Intelligence</div>
              </div>
            </div>

            {/* Hero copy */}
            <div className="lp-hero">
              <div className="lp-badge">
                <span className="lp-badge-dot" aria-hidden="true" />
                TetraTHON 2026 · Hackathon Project
              </div>
              <h1 className="lp-headline">
                AI Credit Scoring,<br />
                <span>Built for Everyone</span>
              </h1>
              <p className="lp-tagline">
                Transparent, explainable, and multilingual financial intelligence
                powered by SHAP — empowering underbanked communities.
              </p>
              <ul className="lp-features" role="list" aria-label="Key features">
                {FEATURES.map((f) => (
                  <li key={f} className="lp-feature">
                    <span className="lp-feature-check" aria-hidden="true">
                      <svg viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Left footer */}
            <div className="lp-left-footer" aria-hidden="true">
              <span>© 2026 TetraScore AI</span>
              <span>Bank-grade security</span>
            </div>
          </div>

          {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════ */}
          <div className="lp-right">
            <div>
              <h2 className="lp-form-title">Welcome back</h2>
              <p className="lp-form-subtitle">Sign in to your TetraScore account</p>

              {/* ── Google OAuth Button ── */}
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="lp-google-btn"
                aria-label="Continue with Google"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="lp-divider" role="separator">
                <div className="lp-divider-line" />
                <span className="lp-divider-text">or</span>
                <div className="lp-divider-line" />
              </div>

              {/* ── Email / Password Form ── */}
              <form onSubmit={handleSubmit} noValidate aria-label="Email sign-in form">
                {/* Email */}
                <div className="lp-field">
                  <label className="lp-label" htmlFor="login-email">
                    Email Address or Username
                  </label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><MailIcon /></span>
                    <input
                      id="login-email"
                      type="text"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com or username"
                      className="lp-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="lp-field">
                  <label className="lp-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><LockIcon /></span>
                    <input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="lp-input"
                    />
                  </div>
                </div>

                {/* Forgot password link */}
                <a href="#" className="lp-forgot" aria-label="Forgot password">
                  Forgot password?
                </a>

                {/* Error message */}
                {error && (
                  <div className="lp-error" role="alert" aria-live="polite">
                    <AlertIcon />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  id="signin-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="lp-submit-btn"
                  aria-label="Sign in"
                >
                  {loading ? (
                    <>
                      <span className="lp-spinner" aria-hidden="true" />
                      Authenticating…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>

            {/* ── Bottom: Demo logins with clear credentials + Register ── */}
            <div className="lp-bottom">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200/80 pb-1.5">
                  <span>🔑 DEMO PORTAL CREDENTIALS</span>
                  <span className="text-[10px] font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-950">Password Protection Active</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* User Demo Card */}
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex flex-col justify-between space-y-1.5 shadow-sm">
                    <div>
                      <span className="font-extrabold text-slate-900 block text-[11px] uppercase tracking-wider text-red-600">👤 User Portal</span>
                      <p className="font-mono text-[11px] text-slate-700">Email: <strong>user@tetrascore.in</strong></p>
                      <p className="font-mono text-[11px] text-slate-700">Password: <strong>user123</strong></p>
                    </div>
                    <button
                      id="demo-user-btn"
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setEmail('user@tetrascore.in');
                        setPassword('user123');
                        handleQuickLogin('user@tetrascore.in', 'john_doe', 'USER');
                      }}
                      className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold text-[11px] transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      Login as Demo User
                    </button>
                  </div>

                  {/* Admin Demo Card */}
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex flex-col justify-between space-y-1.5 shadow-sm">
                    <div>
                      <span className="font-extrabold text-slate-900 block text-[11px] uppercase tracking-wider text-amber-600">👑 Admin Portal</span>
                      <p className="font-mono text-[11px] text-slate-700">Email: <strong>admin@tetrascore.in</strong></p>
                      <p className="font-mono text-[11px] text-slate-700">Password: <strong>admin123</strong></p>
                    </div>
                    <button
                      id="demo-admin-btn"
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setEmail('admin@tetrascore.in');
                        setPassword('admin123');
                        handleQuickLogin('admin@tetrascore.in', 'admin', 'ADMIN');
                      }}
                      className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-[11px] transition-all shadow-sm flex items-center justify-center gap-1 border border-slate-700"
                    >
                      Login as Demo Admin
                    </button>
                  </div>
                </div>
              </div>

              <div className="lp-register-row text-center text-xs text-slate-500 pt-1">
                Don't have an account?{' '}
                <Link to="/register" id="create-account-link" className="font-bold text-red-600 hover:underline">Create Account</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
