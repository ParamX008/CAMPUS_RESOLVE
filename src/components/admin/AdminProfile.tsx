import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  User,
  Phone,
  Mail,
  Calendar,
  Hash,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Profile } from '../../types';
import { api } from '../../lib/api';

interface AdminProfileProps {
  user: Profile;
  onBack: () => void;
  onProfileUpdated?: (updatedUser: Profile) => void;
}

/**
 * Extracts initials from administrator name cleanly.
 * e.g. "Dr. Sarah Jenkins" -> "SJ"
 */
export function getAdminInitials(name?: string): string {
  if (!name) return 'AD';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Cleanly formats date string into readable institutional format (M/D/YYYY).
 * e.g. "1988-01-01" -> "1/1/1988"
 */
export function formatAdminDate(isoDate?: string | null): string {
  if (!isoDate) return 'Not provided';
  try {
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return `${month}/${day}/${year}`;
      }
    }
    const slashParts = isoDate.split('/');
    if (slashParts.length === 3) {
      return isoDate;
    }
    const d = new Date(isoDate);
    if (!isNaN(d.getTime())) {
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    }
    return isoDate;
  } catch {
    return isoDate;
  }
}

export const AdminProfile: React.FC<AdminProfileProps> = ({ user, onBack }) => {
  const [profile, setProfile] = useState<Profile>(user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with prop if it changes
  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  // Fetch the latest authoritative profile data from the backend
  const fetchFreshProfile = async () => {
    if (!user?.account_id) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshUser = await api.getMe(user.account_id);
      if (freshUser) {
        setProfile(freshUser);
      }
    } catch (err: any) {
      console.error('Failed to reload administrator profile:', err);
      setError(err?.message || 'Unable to refresh profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshProfile();
  }, [user?.account_id]);

  // Fallback if no user object exists
  if (!profile) {
    return (
      <div className="space-y-6 pb-16">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#E21B23] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-xl border border-rose-200 p-8 sm:p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-rose-900">Administrator Profile Unavailable</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            The authenticated administrator profile could not be located. Please verify your login credentials or return to the dashboard.
          </p>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-[#E21B23] hover:bg-[#B5122A] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initials = getAdminInitials(profile.name);
  const adminSubRole =
    profile.admin_role === 'super_admin'
      ? 'Super Administrator'
      : profile.admin_role === 'department_staff'
      ? 'Departmental Staff'
      : 'Administrator';

  const campusName =
    profile.university || 'Supreme Knowledge Foundation Group of Institutions';

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      {/* 1. Header & Navigation */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#E21B23] transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Administrative Account
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-semibold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified Staff Credentials
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
              Administrator Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl">
              View your administrator account, contact information, departmental assignment, and institutional role.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchFreshProfile}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50 text-[#111827] text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Updating...' : 'Refresh Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error notification if refresh failed */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Profile Identity Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          {/* Avatar with institutional red brand treatment */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-red-50 border-2 border-red-200 text-[#E21B23] flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-2xs shrink-0 select-none">
            {initials}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#E21B23] border border-red-200">
                <Shield className="w-3.5 h-3.5" />
                <span>{adminSubRole}</span>
              </span>
              <span className="text-xs font-mono font-medium text-[#64748B] bg-[#F8FAFC] px-2.5 py-0.5 rounded border border-[#E2E8F0]">
                ID: {profile.account_id}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] truncate">
              {profile.name}
            </h2>

            <p className="text-xs sm:text-sm text-[#64748B] flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span>{profile.department || 'Central Administration'}</span>
              <span>•</span>
              <span>{campusName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Detailed Contact Information Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sm:p-6 space-y-4">
        <div className="border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <User className="w-4 h-4 text-[#E21B23]" />
            <span>Personal &amp; Contact Information</span>
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Verified identity and direct contact details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {/* Full Name */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-semibold text-[#64748B] flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </span>
            <span className="font-bold text-[#111827] text-right truncate max-w-[200px]">
              {profile.name}
            </span>
          </div>

          {/* Administrator ID */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-semibold text-[#64748B] flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Administrator ID</span>
            </span>
            <span className="font-mono font-bold text-[#111827] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
              {profile.account_id}
            </span>
          </div>

          {/* Phone Number */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-semibold text-[#64748B] flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Phone Number</span>
            </span>
            <span className="font-bold text-[#111827] text-right">
              {profile.phone_number || (profile.phone ? profile.phone.replace(/^\+91/, '') : 'Not provided')}
            </span>
          </div>

          {/* Email Address */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-semibold text-[#64748B] flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Official Email</span>
            </span>
            <span className="font-medium text-[#111827] text-right truncate max-w-[200px]">
              {profile.email || 'Not provided'}
            </span>
          </div>

          {/* Date of Birth */}
          {profile.date_of_birth && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="font-semibold text-[#64748B] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date of Birth</span>
              </span>
              <span className="font-medium text-[#111827] text-right">
                {formatAdminDate(profile.date_of_birth)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
