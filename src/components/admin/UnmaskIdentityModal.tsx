import React, { useState } from 'react';
import { Shield, Eye, AlertTriangle, X, Lock, FileText, Check } from 'lucide-react';
import { Complaint, Profile } from '../../types';
import { api } from '../../lib/api';

interface UnmaskIdentityModalProps {
  complaint: Complaint;
  user: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedComplaint: Complaint) => void;
}

export const UnmaskIdentityModal: React.FC<UnmaskIdentityModalProps> = ({
  complaint,
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnmask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A formal justification reason is required for student dean unmasking.');
      return;
    }
    if (!confirmed) {
      setError('Please acknowledge the institutional audit compliance terms.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await api.unmaskComplaint(
        complaint.id,
        reason.trim(),
        `${user.name} (${user.account_id})`
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to unmask student record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Audited Identity Unmasking
              </h2>
              <p className="text-xs text-purple-800/80 font-medium">
                Grievance Ticket #{complaint.complaint_id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleUnmask} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Privacy Protocol Notice */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Institutional Privacy & Whistleblower Protocol</span>
            </p>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Anonymous reports are shielded to protect students from retaliation. Unmasking is restricted to high-severity investigations, safety emergencies, or verified policy violations. This action is permanently recorded in the immutable audit log.
            </p>
          </div>

          {/* Justification Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Legal / Dean Rationale <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the formal investigative requirement justifying this identity unmasking..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-slate-50 leading-relaxed"
            />
          </div>

          {/* Affirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-slate-700 leading-snug">
              I certify that I am authorized to access this record and that this action complies with campus FERPA and privacy bylaws.
            </span>
          </label>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim() || !confirmed}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-200 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Auditing & Unmasking...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Unmask Identity</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
