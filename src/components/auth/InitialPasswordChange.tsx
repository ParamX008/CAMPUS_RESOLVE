import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, KeyRound, LogOut } from 'lucide-react';
import { Profile } from '../../types';
import { api } from '../../lib/api';

interface InitialPasswordChangeProps {
  user: Profile;
  onPasswordChanged: (updatedUser: Profile) => void;
  onLogout: () => void;
}

export const InitialPasswordChange: React.FC<InitialPasswordChangeProps> = ({
  user,
  onPasswordChanged,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword.trim()) {
      setError('Please enter your initial temporary password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Your new password must be different from your temporary password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await api.changePassword(
        user.account_id || user.student_id || '',
        currentPassword.trim(),
        newPassword
      );
      onPasswordChanged(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please check your temporary password.');
    } finally {
      setIsLoading(false);
    }
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

      {/* Layer 2: Subtle Contrast Translucent Overlay */}
      <div
        className="fixed inset-0 w-full h-full bg-slate-900/35 sm:bg-slate-900/30 -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Layer 3: Main Modal Box */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 sm:p-7 my-auto">
        {/* Official College Logo */}
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

        {/* Heading & Mandatory Prompt */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200 mb-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>First-Time Security Setup Required</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Create Your New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, <strong className="text-slate-800 font-semibold">{user.name}</strong>. Please create a permanent password to access your student dashboard.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug break-words flex-1">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Current Temporary Password */}
          <div>
            <label
              htmlFor="current-temp-password-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Current Temporary Password (DOB DDMMYYYY)
            </label>
            <div className="relative">
              <input
                id="current-temp-password-input"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter initial DOB password (e.g. 15062004)"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors focus:outline-none cursor-pointer"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Your initial password derived from your Date of Birth in DDMMYYYY format.
            </p>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="new-password-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password-input"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new secure password"
                required
                minLength={6}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors focus:outline-none cursor-pointer"
                aria-label={showNew ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirm-new-password-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-new-password-input"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                minLength={6}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors focus:outline-none cursor-pointer"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="save-new-password-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating password...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Set Password & Access Dashboard</span>
              </span>
            )}
          </button>
        </form>

        {/* Sign Out Option */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Logged in as: <strong className="text-slate-700">{user.account_id || user.student_id}</strong></span>
          <button
            onClick={onLogout}
            type="button"
            className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
