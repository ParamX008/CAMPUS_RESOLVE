import React, { useState } from 'react';
import { Phone, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface StudentLoginProps {
  onLogin: (accountId: string, password: string) => Promise<void>;
  onSwitchToAdmin: () => void;
  isLoading: boolean;
  error: string | null;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  onLogin,
  onSwitchToAdmin,
  isLoading,
  error,
}) => {
  const [phoneOrId, setPhoneOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrId.trim() || !password) return;
    onLogin(phoneOrId.trim(), password);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3.5 sm:p-6 overflow-x-hidden">
      {/* Layer 1: Blurred Full-Screen Campus Background Image */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center -z-20 scale-105 pointer-events-none"
        style={{
          backgroundImage: `url('/supreme-knowledge-foundation-group-of-institutions-hooghly-353757.webp'), url('/campus-background.jpg')`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px)',
        }}
        aria-hidden="true"
      />

      {/* Layer 2: Subtle Contrast Translucent Overlay (keeps campus visible without harsh glare) */}
      <div
        className="fixed inset-0 w-full h-full bg-slate-900/35 sm:bg-slate-900/30 -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Layer 3: Sharp, Unaffected Centered Login Panel */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/95 sm:bg-white rounded-2xl border border-white/70 sm:border-slate-200/90 shadow-2xl p-5 sm:p-7 my-auto">
        {/* Institutional Branding: Official College Logo (The ONLY logo on the page) */}
        <div className="flex justify-center mb-4 sm:mb-5">
          <img
            src="/supreme-knowledge-foundation-logo.png"
            alt="Supreme Knowledge Foundation Logo"
            className="h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[250px] object-contain select-none"
            onError={(e) => {
              if (e.currentTarget.src.includes('supreme-knowledge-foundation-logo.png')) {
                e.currentTarget.src = '/college-logo.png';
              }
            }}
          />
        </div>

        {/* Heading & Concise Supporting Text */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student Portal Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sign in to access your complaints and status updates.
          </p>
        </div>

        {/* Clean Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug break-words flex-1">{error}</span>
          </div>
        )}

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="student-id-input"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Phone Number
            </label>
            <div className="relative">
              <input
                id="student-id-input"
                name="phone"
                type="text"
                autoComplete="username tel"
                value={phoneOrId}
                onChange={(e) => setPhoneOrId(e.target.value)}
                placeholder="Enter your phone number"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="student-password-input"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="student-password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors focus:outline-none"
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
            id="student-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </span>
            ) : (
              <span>Sign In as Student</span>
            )}
          </button>
        </form>

        {/* Administrative Portal Secondary Link */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Are you a campus staff member or administrator?
          </p>
          <button
            id="switch-admin-login-link"
            type="button"
            onClick={onSwitchToAdmin}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-primary transition-colors focus:outline-none cursor-pointer"
          >
            <span>Administrator Portal</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
