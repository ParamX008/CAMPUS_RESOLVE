import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserX,
  Clock,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Complaint, Profile } from '../../types';
import { api } from '../../lib/api';

interface AbuseManagementModalProps {
  complaint: Complaint;
  user: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedComplaint: Complaint) => void;
}

export const AbuseManagementModal: React.FC<AbuseManagementModalProps> = ({
  complaint,
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<'legitimate' | 'false'>('legitimate');
  const [issueWarning, setIssueWarning] = useState(false);
  const [applyRestriction, setApplyRestriction] = useState(false);
  const [restrictionDays, setRestrictionDays] = useState(7);
  const [restrictionReason, setRestrictionReason] = useState('Submitting repeated false/abusive claims');
  const [auditNote, setAuditNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditNote.trim()) {
      setError('An administrative audit note is required for abuse determination.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const isFalse = decision === 'false';
      const result = await api.reviewAbuse({
        complaint_id: complaint.id,
        is_deliberately_false: isFalse,
        issue_warning: isFalse && issueWarning,
        apply_restriction: isFalse && applyRestriction,
        restriction_days: applyRestriction ? restrictionDays : undefined,
        restriction_reason: applyRestriction ? restrictionReason : undefined,
        reviewer_name: `${user.name} (${user.role === 'admin' ? 'Admin Staff' : 'Officer'})`,
        audit_note: auditNote.trim(),
      });

      onSuccess(result.complaint);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to execute abuse review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-amber-500/10 border-b border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Abuse & Policy Verification Review
              </h2>
              <p className="text-xs text-amber-900/80 font-medium">
                Ticket #{complaint.complaint_id} • AI Triage Flag: {complaint.ai_abuse_flag ? 'Flagged' : 'Manual'}
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Reason for Flag */}
          {complaint.ai_abuse_reason && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                AI Detection Rationale
              </span>
              <p className="text-slate-600 leading-relaxed italic">
                "{complaint.ai_abuse_reason}"
              </p>
            </div>
          )}

          {/* Core Human Decision */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Human Administrative Determination
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                  decision === 'legitimate'
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="abuse-decision"
                  checked={decision === 'legitimate'}
                  onChange={() => {
                    setDecision('legitimate');
                    setIssueWarning(false);
                    setApplyRestriction(false);
                  }}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs">Legitimate Grievance</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Clear flag; valid student concern.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                  decision === 'false'
                    ? 'border-rose-500 bg-rose-50/60 text-rose-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="abuse-decision"
                  checked={decision === 'false'}
                  onChange={() => setDecision('false')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-xs">Deliberately False</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Spam, hoax, or policy violation.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Actions if Marked False */}
          {decision === 'false' && (
            <div className="p-4 bg-rose-50/40 border border-rose-200 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">
                Disciplinary & Policy Actions
              </span>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={issueWarning}
                  onChange={(e) => setIssueWarning(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Issue Official Account Warning to Student Profile</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyRestriction}
                  onChange={(e) => setApplyRestriction(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-800">
                  Impose Temporary Submission Restriction
                </span>
              </label>

              {applyRestriction && (
                <div className="pl-6 space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Restriction Period (Days)
                    </label>
                    <select
                      value={restrictionDays}
                      onChange={(e) => setRestrictionDays(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                    >
                      <option value={3}>3 Days (Minor Infraction)</option>
                      <option value={7}>7 Days (Standard First Violation)</option>
                      <option value={14}>14 Days (Repeated Spam)</option>
                      <option value={30}>30 Days (Severe Violation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Reason Displayed to Student
                    </label>
                    <input
                      type="text"
                      value={restrictionReason}
                      onChange={(e) => setRestrictionReason(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Note (Mandatory) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Administrative Audit Justification Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Provide clear rationale for this policy review finding (logged to immutable audit trail)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-200 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Executing Review...</span>
              ) : (
                <span>Commit Policy Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
