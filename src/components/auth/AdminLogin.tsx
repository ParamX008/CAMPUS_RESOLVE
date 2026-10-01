import React, { useState } from 'react';
import {
  ArrowRight,
  KeyRound,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface AdminLoginProps {
  onLogin: (accountId: string, password: string) => Promise<void>;
  onSwitchToStudent: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLogin,
  onSwitchToStudent,
  isLoading,
  error,
}) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim() || !password) return;
    onLogin(adminId.trim(), password);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3.5 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Full-Screen Campus Background Image (Sharp, undistorted, covering entire viewport) */}
      <div
        className="fixed inset-0 w-full h-full bg-cover pointer-events-none"
        style={{
          backgroundImage: `url('/supreme-knowledge-foundation-group-of-institutions-hooghly-353757.webp'), url('/campus-background.jpg')`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      {/* Subtle Contrast Translucent Overlay (Keeps background sharp while ensuring card readability) */}
      <div
        className="fixed inset-0 w-full h-full bg-slate-950/30 sm:bg-slate-950/25 pointer-events-none"
        aria-hidden="true"
      />

      {/* Centered Institutional Desktop-First Admin Login Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white rounded-xl sm:rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-8 my-auto">
        {/* Institutional Branding: Official Supreme Knowledge Foundation College Logo */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <img
            src="/supreme-knowledge-foundation-logo.png"
            alt="Supreme Knowledge Foundation Logo"
            className="h-11 sm:h-13 w-auto max-w-[220px] sm:max-w-[260px] object-contain select-none"
            onError={(e) => {
              if (e.currentTarget.src.includes('supreme-knowledge-foundation-logo.png')) {
                e.currentTarget.src = '/college-logo.png';
              }
            }}
          />
        </div>

        {/* Portal Title & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed max-w-sm mx-auto">
            Grievance triage, departmental assignment, investigation, and status workflow
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug break-words flex-1">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-id-input"
              className="block text-xs font-semibold text-[#111827] mb-1.5"
            >
              Administrator ID
            </label>
            <div className="relative">
              <input
                id="admin-id-input"
                name="adminId"
                type="text"
                autoComplete="username"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value.toUpperCase())}
                placeholder="Enter Administrator ID (e.g. ADMSKF01)"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#E21B23]/15 focus:border-[#E21B23] text-sm text-[#111827] font-mono placeholder:text-slate-400 placeholder:font-sans transition-colors"
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-semibold text-[#111827] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#E21B23]/15 focus:border-[#E21B23] text-sm text-[#111827] placeholder:text-slate-400 transition-colors"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            id="admin-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#E21B23] hover:bg-[#B5122A] active:bg-[#991B1B] text-white font-semibold text-sm shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Student Portal Switcher */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
          <p className="text-xs text-[#64748B]">Looking for the Student Portal?</p>
          <button
            id="switch-student-login-link"
            type="button"
            onClick={onSwitchToStudent}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#E21B23] hover:text-[#B5122A] transition-colors focus:outline-none cursor-pointer"
          >
            <span>← Switch to Student Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
