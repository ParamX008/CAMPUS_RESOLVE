import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Clock,
  EyeOff,
  User,
  CheckCircle2,
  FileText,
  ZoomIn,
  Star,
  Archive,
} from 'lucide-react';
import { Complaint } from '../../types';
import { api } from '../../lib/api';
import { StatusBadge, StarRating } from '../common/Badge';
import { ComplaintFeedbackModal } from './ComplaintFeedbackModal';

interface ComplaintDetailViewProps {
  complaint: Complaint;
  onBack: () => void;
  onComplaintUpdated?: (updated: Complaint) => void;
  onFeedbackSuccess?: () => void;
}

export const ComplaintDetailView: React.FC<ComplaintDetailViewProps> = ({
  complaint: initialComplaint,
  onBack,
  onComplaintUpdated,
  onFeedbackSuccess,
}) => {
  const [complaint, setComplaint] = useState<Complaint>(initialComplaint);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  React.useEffect(() => {
    setComplaint(initialComplaint);
  }, [initialComplaint]);

  const handleFeedbackSuccess = (updated: Complaint) => {
    setComplaint(updated);
    if (onComplaintUpdated) onComplaintUpdated(updated);
    if (onFeedbackSuccess) {
      onFeedbackSuccess();
    } else {
      onBack();
    }
  };

  const handleArchiveComplaint = async () => {
    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') return;
    setIsArchiving(true);
    try {
      const updated = await api.archiveComplaint(complaint.id);
      setComplaint(updated);
      if (onComplaintUpdated) onComplaintUpdated(updated);
      onBack();
    } catch (err: any) {
      console.error('Failed to archive complaint:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  const updates = complaint.updates || [];
  const isResolvedOrClosed = complaint.status === 'Resolved' || complaint.status === 'Closed';

  return (
    <div className="w-full max-w-4xl mx-auto pb-16 space-y-4 sm:space-y-5">
      {/* Top Back Navigation Bar - Responsive Stacking on Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
        <button
          id="back-to-dashboard-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs self-start"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {isResolvedOrClosed && (
            complaint.student_archived ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <span>Archived</span>
              </span>
            ) : (
              <button
                id="student-archive-complaint-top-btn"
                onClick={handleArchiveComplaint}
                disabled={isArchiving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Archive this resolved complaint from my active dashboard"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>{isArchiving ? 'Archiving...' : 'Archive Complaint'}</span>
              </button>
            )
          )}
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 shrink-0">
            {complaint.complaint_id}
          </span>
          <StatusBadge status={complaint.status} size="md" />
        </div>
      </div>

      {/* Resolution Notification & Student Rating Banner */}
      {isResolvedOrClosed && (
        <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-emerald-950">
                  This Complaint Has Been Marked Resolved
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-md">
                  Completed
                </span>
              </div>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                Campus administration has addressed your reported issue. Please rate your satisfaction with the resolution.
              </p>
              {complaint.feedback_comment && (
                <div className="mt-2 text-xs text-emerald-950 bg-white/80 p-2.5 rounded-xl border border-emerald-200 italic break-words">
                  "{complaint.feedback_comment}"
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-end sm:justify-start flex-wrap">
            {!complaint.student_archived && (
              <button
                id="student-archive-complaint-btn"
                onClick={handleArchiveComplaint}
                disabled={isArchiving}
                className="px-3.5 py-2.5 rounded-xl border border-emerald-400 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Archive this resolved complaint from my active dashboard"
              >
                <Archive className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isArchiving ? 'Archiving...' : 'Archive Complaint'}</span>
              </button>
            )}

            {complaint.feedback_rating ? (
              <div className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <StarRating rating={complaint.feedback_rating} size="sm" />
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="text-xs text-emerald-800 underline hover:text-emerald-950 font-semibold"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                id="rate-resolution-btn"
                onClick={() => setIsFeedbackModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Rate Resolution</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Complaint Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        {/* Category & Identity Badges (wrap naturally on mobile) */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
            {complaint.category}
          </span>
          {complaint.identity_mode === 'anonymous' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Anonymous Submission</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium pastel-green px-2.5 py-1 rounded-lg border">
              <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{complaint.student_name}</span>
            </span>
          )}
        </div>

        {/* Complaint Title */}
        <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-snug break-words">
          {complaint.title}
        </h1>

        {/* Metadata: Stacked vertically on mobile, 3-column grid on desktop */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 flex flex-col sm:grid sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="flex items-start gap-2.5 min-w-0">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Submitted On</p>
              <p className="font-medium text-slate-800 break-words mt-0.5">
                {new Date(complaint.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 min-w-0">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Department Assigned</p>
              <p className="font-medium text-slate-800 break-words mt-0.5">
                {complaint.department_name || 'Campus Services Office'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Last Updated</p>
              <p className="font-medium text-slate-800 break-words mt-0.5">
                {new Date(complaint.updated_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted Content & Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Your Submitted Grievance */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Your Submitted Description</span>
          </h2>
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
            {complaint.description}
          </div>
        </div>

        {/* Uploaded Evidence */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            <span>Attached Photo Evidence</span>
          </h2>

          {complaint.image_url ? (
            <div className="flex-1 flex flex-col justify-between">
              <div
                onClick={() => setSelectedImageModal(complaint.image_url || null)}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-4/3 flex items-center justify-center cursor-pointer max-w-full"
              >
                <img
                  src={complaint.image_url}
                  alt="Complaint Evidence"
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                  <ZoomIn className="w-4 h-4" />
                  <span>Click to expand</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Captured with submission
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-500">No image attached</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Text-only submission</p>
            </div>
          )}
        </div>
      </div>

      {/* Department Progress & Status Updates */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>Status Updates & Department Notes</span>
        </h2>

        {updates.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            Your complaint has been submitted and is queued for departmental review.
          </p>
        ) : (
          <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {updates.map((step, idx) => (
              <div key={step.id || idx} className="relative">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-primary text-white border-2 border-white flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={step.status} size="sm" />
                      <span className="text-xs font-semibold text-slate-800 break-words">
                        {step.updated_by}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(step.created_at).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-1 leading-relaxed break-words">
                    {step.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Lightbox Modal */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <img
              src={selectedImageModal}
              alt="Evidence Fullscreen"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Student Resolution Feedback Modal */}
      {isFeedbackModalOpen && (
        <ComplaintFeedbackModal
          complaint={complaint}
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
};
