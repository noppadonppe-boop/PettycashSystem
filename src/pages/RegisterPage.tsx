import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail, AuthError } from '../auth/authService';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.status === 'approved') navigate('/dashboard', { replace: true });
    if (userProfile.status === 'pending') navigate('/pending', { replace: true });
  }, [userProfile, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await registerWithEmail({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position.trim(),
      });
      await refreshProfile();
    } catch (e2) {
      setError((e2 as AuthError).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">CMG</p>
            <p className="text-blue-300 text-xs leading-tight">Petty Cash System</p>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            สมัครใช้งาน<br />
            <span className="text-blue-400">เริ่มต้นได้เลย</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            สร้างบัญชีเพื่อเข้าถึงระบบจัดการเงินสดย่อย<br />
            ผู้ดูแลระบบจะอนุมัติสิทธิ์การเข้าใช้งานให้คุณ
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-white text-sm font-semibold mb-3">📋 ขั้นตอนการสมัคร</p>
            <div className="flex flex-col gap-2.5">
              {['กรอกข้อมูลส่วนตัวให้ครบถ้วน', 'รอผู้ดูแลระบบอนุมัติบัญชี', 'เข้าสู่ระบบและเริ่มใช้งาน'].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-slate-300 text-sm">{s}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-amber-300 text-xs">
                ⭐ ผู้สมัครคนแรกจะได้รับสิทธิ์ MasterAdmin อัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-600 text-xs">© 2026 CMG · All rights reserved</p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-tight">CMG Petty Cash</p>
              <p className="text-xs text-slate-400">ระบบจัดการเงินสดย่อย</p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">สร้างบัญชีใหม่</h2>
            <p className="text-slate-500 text-sm mt-1">กรอกข้อมูลด้านล่างเพื่อสมัครใช้งาน</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <span className="text-rose-400 shrink-0 mt-0.5">✕</span>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">ชื่อ <span className="text-rose-500">*</span></label>
                <input
                  id="firstName"
                  placeholder="สมชาย"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">นามสกุล <span className="text-rose-500">*</span></label>
                <input
                  id="lastName"
                  placeholder="ใจดี"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Position */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="position" className="text-sm font-medium text-slate-700">ตำแหน่ง <span className="text-rose-500">*</span></label>
              <input
                id="position"
                placeholder="เช่น Project Manager"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email <span className="text-rose-500">*</span></label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">รหัสผ่าน <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-md shadow-blue-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
            >
              {submitting ? <><Spinner /> กำลังสร้างบัญชี…</> : 'สร้างบัญชี'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
