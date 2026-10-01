import React, { useState } from 'react';
import {
  User,
  Phone,
  Calendar,
  Mail,
  Building2,
  GraduationCap,
  Hash,
  CreditCard,
  CheckCircle2,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { Profile } from '../../types';
import {
  MaleStudentAvatarSVG,
  FemaleStudentAvatarSVG,
  getStudentGender,
} from '../common/StudentAvatar';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

interface StudentProfileProps {
  user: Profile;
  onProfileUpdated?: (updatedUser: Profile) => void;
}

/**
 * Get or compute a persistent, stable 8-character uppercase alphanumeric Student ID.
 * Examples: K7P4X2Q9, A8M2X7P4
 */
export function getStudentId(user: Profile): string {
  if (user.student_id && /^[A-Z0-9]{8}$/.test(user.student_id)) {
    return user.student_id;
  }
  if (user.account_id && /^[A-Z0-9]{8}$/.test(user.account_id)) {
    return user.account_id;
  }

  // Stable deterministic hash based on user account_id / auth_user_id
  const seed = (user.account_id || user.id || 'STUDENT').toUpperCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  let h = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    result += chars[h % chars.length];
    h = Math.floor(h / chars.length) + (i * 13 + 7);
  }
  return result;
}

/**
 * Get student's roll number separately from their Student ID.
 */
export function getRollNumber(user: Profile): string {
  if (user.roll_number) return user.roll_number;
  return user.account_id || 'Not provided';
}

/**
 * Formats ISO or YYYY-MM-DD date string into a clean, human-readable date.
 * Example: "2003-04-15" -> "15 April 2003"
 */
export function formatDob(dob?: string): string {
  if (!dob) return 'Not provided';
  try {
    const parts = dob.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day) && !isNaN(year)) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    return dob;
  } catch {
    return dob;
  }
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ user, onProfileUpdated }) => {
  const gender = getStudentGender(user);
  const studentId = getStudentId(user);
  const rollNumber = getRollNumber(user);
  const university = user.university || 'Supreme Knowledge Foundation Group of Institutions';

  // Password Change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Form Validations
    if (!currentPassword.trim()) {
      setError('Current password is required.');
      return;
    }
    if (!newPassword) {
      setError('New password is required.');
      return;
    }
    if (!confirmPassword) {
      setError('Confirm password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters in length.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      let updatedViaSupabase = false;

      // 1. Supabase Auth authenticated-user password update flow
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            // Securely call Supabase Auth with current password verification
            const { error: sbError } = await supabase.auth.updateUser({
              password: newPassword,
              current_password: currentPassword,
            } as any);

            if (sbError) {
              const rawMsg = sbError.message || '';
              const lower = rawMsg.toLowerCase();
              if (
                lower.includes('current password') ||
                lower.includes('invalid password') ||
                lower.includes('password is incorrect') ||
                lower.includes('invalid credentials') ||
                (sbError.status === 400 && lower.includes('password') && lower.includes('invalid'))
              ) {
                throw new Error('Current password is incorrect.');
              }
              if (
                lower.includes('weak') ||
                lower.includes('strength') ||
                lower.includes('short') ||
                lower.includes('character')
              ) {
                throw new Error(rawMsg);
              }
              throw new Error(rawMsg || 'Failed to update password in Supabase Auth.');
            }
            updatedViaSupabase = true;
          }
        } catch (sbErr: any) {
          if (
            sbErr.message === 'Current password is incorrect.' ||
            sbErr.message === 'New passwords do not match.'
          ) {
            throw sbErr;
          }
          if (sbErr.message && !sbErr.message.includes('fetch') && !sbErr.message.includes('Failed to fetch')) {
            throw sbErr;
          }
        }
      }

      // 2. Synchronize and permanently persist the new password in backend storage
      const accountIdentifier = user.account_id || user.student_id;
      if (!accountIdentifier) {
        throw new Error('Student account identifier not found.');
      }

      const updatedProfile = await api.changePassword(
        accountIdentifier,
        currentPassword.trim(),
        newPassword
      );

      if (updatedProfile) {
        try {
          localStorage.setItem('campus_active_user', JSON.stringify(updatedProfile));
        } catch {
          // ignore localStorage quota error
        }
        if (onProfileUpdated) {
          onProfileUpdated(updatedProfile);
        }
      }

      // Success Behavior
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setSuccessMessage('Password changed successfully.');
      setIsChangingPassword(false);
    } catch (err: any) {
      const msg = err.message || '';
      const lower = msg.toLowerCase();
      if (
        lower.includes('current password') ||
        lower.includes('temporary password') ||
        lower.includes('current_password')
      ) {
        setError('Current password is incorrect.');
      } else if (lower.includes('not match') || lower.includes('do not match')) {
        setError('New passwords do not match.');
      } else {
        setError(msg || 'An error occurred while changing your password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const personalFields = [
    {
      id: 'full_name',
      label: 'Full Name',
      value: user.name,
      icon: <User className="w-4 h-4 text-slate-400 shrink-0" />,
    },
    {
      id: 'dob',
      label: 'Date of Birth',
      value: formatDob(user.date_of_birth),
      icon: <Calendar className="w-4 h-4 text-slate-400 shrink-0" />,
    },
  ];

  const contactFields = [
    {
      id: 'phone',
      label: 'Phone Number',
      value: user.phone || 'Not provided',
      verified: true,
      icon: <Phone className="w-4 h-4 text-slate-400 shrink-0" />,
    },
    ...(user.email && user.email.trim() !== ''
      ? [
          {
            id: 'email',
            label: 'Email Address',
            value: user.email,
            icon: <Mail className="w-4 h-4 text-slate-400 shrink-0" />,
          },
        ]
      : []),
  ];

  const academicFields = [
    {
      id: 'roll_number',
      label: 'Roll Number',
      value: rollNumber,
      isMono: true,
      icon: <Hash className="w-4 h-4 text-slate-400 shrink-0" />,
    },
    {
      id: 'student_id',
      label: 'Student ID',
      value: studentId,
      isMono: true,
      badge: true,
      icon: <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />,
    },
    {
      id: 'department',
      label: 'Department',
      value: user.department || 'Not provided',
      icon: <Building2 className="w-4 h-4 text-slate-400 shrink-0" />,
    },
    {
      id: 'university',
      label: 'University',
      value: university,
      icon: <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />,
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto pb-12 sm:pb-16 space-y-4 sm:space-y-5">
      {/* Profile Header: Compact & Mobile-First */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
          {/* Circular Student Avatar (same vector style as dashboard) */}
          <div
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs ring-1 ring-slate-200/80 flex items-center justify-center select-none"
            aria-label={`${gender} student avatar`}
          >
            {gender === 'female' ? <FemaleStudentAvatarSVG /> : <MaleStudentAvatarSVG />}
          </div>

          {/* Student Identity Information */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 justify-center sm:justify-start">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
                {user.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-center sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Student</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="font-medium">
                Roll No: <span className="font-mono font-bold text-slate-900">{rollNumber}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="font-medium">
                Student ID:{' '}
                <span className="font-mono font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded border border-primary-border">
                  {studentId}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Personal Information</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:gap-x-6 sm:gap-y-3.5 divide-slate-100 mt-2">
          {personalFields.map((field) => (
            <div
              key={field.id}
              className="py-3 sm:py-3 sm:px-3 sm:bg-slate-50/70 sm:rounded-xl sm:border sm:border-slate-100 flex items-start gap-3 min-w-0"
            >
              <div className="mt-0.5">{field.icon}</div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {field.label}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words mt-0.5 leading-snug">
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Contact Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span>Contact Information</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:gap-x-6 sm:gap-y-3.5 divide-slate-100 mt-2">
          {contactFields.map((field) => (
            <div
              key={field.id}
              className="py-3 sm:py-3 sm:px-3 sm:bg-slate-50/70 sm:rounded-xl sm:border sm:border-slate-100 flex items-start gap-3 min-w-0"
            >
              <div className="mt-0.5">{field.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {field.label}
                  </span>
                  {field.verified && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words mt-0.5 leading-snug">
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Academic Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span>Academic Information</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400 font-mono hidden sm:inline">
            {studentId}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:gap-x-6 sm:gap-y-3.5 divide-slate-100 mt-2">
          {academicFields.map((field) => (
            <div
              key={field.id}
              className="py-3 sm:py-3 sm:px-3 sm:bg-slate-50/70 sm:rounded-xl sm:border sm:border-slate-100 flex items-start gap-3 min-w-0"
            >
              <div className="mt-0.5">{field.icon}</div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {field.label}
                </span>
                <p
                  className={`text-xs sm:text-sm font-semibold text-slate-900 break-words mt-0.5 leading-snug ${
                    field.isMono ? 'font-mono' : ''
                  }`}
                >
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Security: Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Security</span>
          </h2>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-semibold flex-1 leading-snug">{successMessage}</span>
          </div>
        )}

        <div className="mt-4">
          {!isChangingPassword ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">Change Password</h3>
                </div>
                <p className="text-xs text-slate-500 pl-6 sm:pl-6">
                  Update your account password at any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(true);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover active:bg-primary-active rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handlePasswordChangeSubmit}
              className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Change Password
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Update account credentials
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-snug break-words flex-1 font-semibold">{error}</span>
                </div>
              )}

              {/* 1. Current Password */}
              <div>
                <label
                  htmlFor="student-current-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="student-current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2. New Password */}
              <div>
                <label
                  htmlFor="student-new-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="student-new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Password must be at least 6 characters in length.
                </p>
              </div>

              {/* 3. Confirm New Password */}
              <div>
                <label
                  htmlFor="student-confirm-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="student-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Form Action Buttons: Cancel and Update Password */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-60 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover active:bg-primary-active rounded-xl shadow-xs transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
