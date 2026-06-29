import { useState } from 'react';
import {
  BookOpen, Eye, EyeOff, Loader2, AlertCircle,
  ArrowRight, Mail, Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const demoRoles = [
  { role: 'student'     as const, label: 'Student',     email: 'juan.delacruz@ndkc-ojt.com',  password: 'Student@2026',     color: '#006a61' },
  { role: 'supervisor'  as const, label: 'Supervisor',  email: 'maria.santos@ndkc-ojt.com',    password: 'Supervisor@2026',  color: '#1f108e' },
  { role: 'coordinator' as const, label: 'Coordinator', email: 'roberto.reyes@ndkc-ojt.com',   password: 'Coordinator@2026', color: '#D97706' },
  { role: 'admin'       as const, label: 'Admin',       email: 'admin@ndkc-ojt.com',            password: 'Admin@2026!',      color: '#ba1a1a' },
];

export function LoginPage() {
  const { login, error } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [localError, setLocalError] = useState('');
  const [emailFocused, setEmailFocused]   = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setLocalError('Please enter your email and password.'); return; }
    setLocalError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('INVALID_LOGIN_CREDENTIALS') || msg.includes('user-not-found') || msg.includes('wrong-password')) {
        setLocalError('Invalid email or password. Please try again.');
      } else if (msg.includes('too-many-requests')) {
        setLocalError('Too many failed attempts. Please wait and try again.');
      } else {
        setLocalError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: typeof demoRoles[0]['role']) => {
    const r = demoRoles.find(d => d.role === role)!;
    setEmail(r.email); setPassword(r.password); setLocalError('');
  };

  const displayError = localError || error;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: '#f8f9ff',
        backgroundImage:
          'radial-gradient(at 0% 0%, #ccdbf3 0px, transparent 50%), radial-gradient(at 100% 100%, #e2dfff 0px, transparent 50%)',
        fontFamily: "'Hanken Grotesk', sans-serif",
      }}
    >
      {/* Corner decoration — top right */}
      <div className="fixed top-0 right-0 w-64 h-64 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-12 -right-12 w-full h-full rounded-full" style={{ border: '32px solid rgba(134,242,228,0.15)' }} />
      </div>
      {/* Corner decoration — bottom left */}
      <div className="fixed bottom-0 left-0 w-48 h-48 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -bottom-8 -left-8 w-full h-full rounded-full" style={{ background: 'rgba(55,48,163,0.08)' }} />
      </div>

      <main className="w-full max-w-[440px]">
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 flex items-center justify-center mb-4"
            style={{ background: '#1f108e', borderRadius: '16px', boxShadow: '0 8px 24px rgba(31,16,142,0.25)' }}
          >
            <BookOpen size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.01em', color: '#1f108e', lineHeight: 1.2 }}>
            OJT Monitor
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#777584', marginTop: '4px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
            Notre Dame of Kidapawan College
          </p>
        </div>

        {/* Glass card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(200,196,213,0.6)',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 4px 24px rgba(31,16,142,0.07)',
          }}
        >
          <div className="mb-6">
            <h2 style={{ fontWeight: 600, fontSize: '1.25rem', color: '#0d1c2e', letterSpacing: '-0.01em' }}>Welcome Back</h2>
            <p style={{ fontSize: '0.87rem', color: '#777584', marginTop: '4px' }}>Please enter your details to sign in.</p>
          </div>

          {displayError && (
            <div className="flex items-start gap-2.5 mb-5 p-3" style={{ background: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '6px' }}>
              <AlertCircle size={14} style={{ color: '#93000a', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '0.82rem', color: '#93000a' }}>{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#464553', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: emailFocused ? '#1f108e' : '#777584', pointerEvents: 'none' }}
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setLocalError(''); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="w-full focus:outline-none transition-all"
                  style={{
                    paddingLeft: '40px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${emailFocused ? '#1f108e' : '#c8c4d5'}`,
                    boxShadow: emailFocused ? '0 0 0 3px rgba(31,16,142,0.09)' : 'none',
                    background: '#ffffff',
                    fontSize: '0.9rem',
                    color: '#0d1c2e',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#464553', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: passwordFocused ? '#1f108e' : '#777584', pointerEvents: 'none' }}
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLocalError(''); }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="w-full focus:outline-none transition-all"
                  style={{
                    paddingLeft: '40px', paddingRight: '44px', paddingTop: '10px', paddingBottom: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${passwordFocused ? '#1f108e' : '#c8c4d5'}`,
                    boxShadow: passwordFocused ? '0 0 0 3px rgba(31,16,142,0.09)' : 'none',
                    background: '#ffffff',
                    fontSize: '0.9rem',
                    color: '#0d1c2e',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#777584' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#464553'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#777584'; }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: '#1f108e',
                color: '#ffffff',
                paddingTop: '12px',
                paddingBottom: '12px',
                borderRadius: '9999px',
                fontSize: '0.95rem',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(31,16,142,0.18)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3730a3'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1f108e'; }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : <>Sign In <ArrowRight size={16} /></>
              }
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid rgba(200,196,213,0.5)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3" style={{ background: 'rgba(255,255,255,0.82)', fontSize: '0.68rem', color: '#777584', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Quick Demo Access
                </span>
              </div>
            </div>

            {/* Demo role buttons */}
            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => fillDemo(r.role)}
                  className="flex items-center gap-2 px-3 py-2.5 transition-all"
                  style={{
                    border: '1px solid #c8c4d5',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: '#464553',
                    cursor: 'pointer',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.color = r.color; e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8c4d5'; e.currentTarget.style.color = '#464553'; e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  {r.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-5" style={{ fontSize: '0.82rem', color: '#777584' }}>
          © 2026 Notre Dame of Kidapawan College
        </p>
      </main>
    </div>
  );
}
