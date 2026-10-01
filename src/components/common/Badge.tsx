import React from 'react';
import { ComplaintStatus, ComplaintPriority, IdentityMode } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wide uppercase',
    lg: 'px-3 py-1.5 text-xs font-bold tracking-wide uppercase',
  }[size];

  // Semantic styles for status
  const styles: Record<ComplaintStatus, string> = {
    Pending: 'pastel-yellow border border-amber-300/80',
    'In Progress': 'pastel-blue border border-blue-300/80',
    'Under Investigation': 'bg-sky-50 text-sky-800 border border-sky-300/80',
    Resolved: 'pastel-green border border-emerald-300/80',
    Closed: 'pastel-slate border border-slate-300',
  };

  const dots: Record<ComplaintStatus, string> = {
    Pending: 'bg-amber-600',
    'In Progress': 'bg-blue-600',
    'Under Investigation': 'bg-sky-600',
    Resolved: 'bg-emerald-600',
    Closed: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${styles[status] || styles.Pending} ${sizeClasses} whitespace-nowrap shadow-2xs transition-colors`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.Pending}`} />
      {status}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase'
      : 'px-2.5 py-1 text-xs font-bold tracking-wide uppercase';

  const styles: Record<ComplaintPriority, string> = {
    Low: 'pastel-blue border border-blue-200',
    Medium: 'pastel-yellow border border-amber-200',
    High: 'bg-orange-50 text-orange-800 border border-orange-200',
    Urgent: 'pastel-red border border-red-200 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${styles[priority] || styles.Medium} ${sizeClasses} whitespace-nowrap shadow-2xs`}
    >
      {priority}
    </span>
  );
};

export const IdentityBadge: React.FC<{ mode: IdentityMode; studentName?: string; isUnmasked?: boolean }> = ({
  mode,
  studentName,
  isUnmasked,
}) => {
  if (isUnmasked) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-[#B5122A] border border-red-200">
        <svg className="w-3 h-3 text-[#E21B23]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Unmasked: {studentName || 'Student'}
      </span>
    );
  }

  if (mode === 'anonymous') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
        Anonymous Student
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      {studentName || 'Identified Student'}
    </span>
  );
};

export const AbuseBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status || status === 'None') return null;

  if (status === 'Review Required') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 tracking-wide uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Abuse Review Req.
      </span>
    );
  }

  if (status === 'Verified False') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 tracking-wide uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
        Verified False
      </span>
    );
  }

  if (status === 'Verified Legitimate') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-300 tracking-wide uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
        Verified Legitimate
      </span>
    );
  }

  return null;
};

export const SafetyAlertBadge: React.FC<{ type?: string | null }> = ({ type }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse tracking-wide">
      <span className="text-xs">🚨</span>
      {type && type !== 'None' ? type : 'Safety Alert'}
    </span>
  );
};

export const StarRating: React.FC<{ rating: number; max?: number; size?: 'sm' | 'md' }> = ({
  rating,
  max = 5,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="inline-flex items-center gap-0.5" title={`${rating} of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`${iconSize} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};
